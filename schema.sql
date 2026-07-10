-- =====================================================================
-- LIFELINK BACKEND SCHEMA
-- Run this once in Supabase → SQL Editor → New Query → Run
-- Safe to re-run: uses IF NOT EXISTS / DROP ... IF EXISTS guards.
-- =====================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists postgis;

-- ---------- ENUM: user role ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('donor', 'doctor', 'hospital', 'admin');
  end if;
end $$;

-- =====================================================================
-- TABLE: profiles  (1 row per auth user)
-- =====================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  role user_role not null default 'donor',
  is_organ_donor boolean not null default false,
  location geography(Point, 4326),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

-- Doctors ONLY can see the rows of registered organ donors.
-- Normal donors / recipients cannot see anyone else's profile.
drop policy if exists "profiles_select_organ_donors_for_doctors" on profiles;
create policy "profiles_select_organ_donors_for_doctors" on profiles
  for select using (
    is_organ_donor = true
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'doctor'
    )
  );

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via sb.auth.signUp()
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, blood_group, is_organ_donor, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'blood_group',
    coalesce((new.raw_user_meta_data->>'is_organ_donor')::boolean, false),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'donor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- TABLE: hospitals
-- =====================================================================
create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,                     -- e.g. 'Multi-specialty', 'Transplant Center'
  address text,
  phone text,
  location geography(Point, 4326) not null,
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

alter table hospitals enable row level security;

drop policy if exists "hospitals_public_read" on hospitals;
create policy "hospitals_public_read" on hospitals
  for select using (true);

drop policy if exists "hospitals_admin_write" on hospitals;
create policy "hospitals_admin_write" on hospitals
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital'))
  );

-- =====================================================================
-- TABLE: blood_inventory  (per hospital, per blood group)
-- =====================================================================
create table if not exists blood_inventory (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available int not null default 0,
  updated_at timestamptz not null default now(),
  unique (hospital_id, blood_group)
);

alter table blood_inventory enable row level security;

drop policy if exists "blood_inventory_public_read" on blood_inventory;
create policy "blood_inventory_public_read" on blood_inventory
  for select using (true);

drop policy if exists "blood_inventory_hospital_write" on blood_inventory;
create policy "blood_inventory_hospital_write" on blood_inventory
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital'))
  );

-- =====================================================================
-- TABLE: organ_availability  (per hospital, per organ type)
-- Public counts feed the site's organ cards. The underlying donor
-- identities stay locked behind the profiles policy above (doctors only).
-- =====================================================================
create table if not exists organ_availability (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  organ_type text not null check (organ_type in
    ('Heart','Lungs','Liver','Kidney','Eye','Bone Marrow','Pancreas','Brain')),
  donors_available int not null default 0,
  updated_at timestamptz not null default now(),
  unique (hospital_id, organ_type)
);

alter table organ_availability enable row level security;

drop policy if exists "organ_availability_public_read" on organ_availability;
create policy "organ_availability_public_read" on organ_availability
  for select using (true);

drop policy if exists "organ_availability_doctor_write" on organ_availability;
create policy "organ_availability_doctor_write" on organ_availability
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital','doctor'))
  );

-- =====================================================================
-- TABLE: requests  (blood or organ requests / SOS)
-- =====================================================================
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  request_type text not null check (request_type in ('blood','organ')),
  blood_group text,
  organ_type text,
  urgency text not null default 'normal' check (urgency in ('normal','urgent','critical')),
  status text not null default 'open' check (status in ('open','matched','fulfilled','cancelled','expired')),
  location geography(Point, 4326),
  created_at timestamptz not null default now()
);

alter table requests enable row level security;

drop policy if exists "requests_select_own_or_staff" on requests;
create policy "requests_select_own_or_staff" on requests
  for select using (
    requester_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital'))
  );

drop policy if exists "requests_insert_own" on requests;
create policy "requests_insert_own" on requests
  for insert with check (requester_id = auth.uid());

drop policy if exists "requests_update_staff" on requests;
create policy "requests_update_staff" on requests
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital'))
  );

-- =====================================================================
-- TABLE: emergency_alerts  (broadcast layer on top of requests)
-- =====================================================================
create table if not exists emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  triggered_by uuid references profiles(id) on delete cascade,
  radius_km int not null default 10,
  created_at timestamptz not null default now()
);

alter table emergency_alerts enable row level security;

drop policy if exists "emergency_alerts_public_read" on emergency_alerts;
create policy "emergency_alerts_public_read" on emergency_alerts
  for select using (true);

drop policy if exists "emergency_alerts_insert_own" on emergency_alerts;
create policy "emergency_alerts_insert_own" on emergency_alerts
  for insert with check (triggered_by = auth.uid());

-- =====================================================================
-- TABLE: donations  (completed donation history, feeds streak badge)
-- =====================================================================
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references profiles(id) on delete cascade,
  hospital_id uuid references hospitals(id),
  donation_type text not null check (donation_type in ('blood','organ')),
  blood_group text,
  organ_type text,
  donated_at timestamptz not null default now()
);

alter table donations enable row level security;

drop policy if exists "donations_select_own_or_staff" on donations;
create policy "donations_select_own_or_staff" on donations
  for select using (
    donor_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital'))
  );

drop policy if exists "donations_insert_staff" on donations;
create policy "donations_insert_staff" on donations
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hospital'))
  );

-- =====================================================================
-- RPC: nearby_hospitals(lat, lng, radius_km)
-- Used by the live map on the site.
-- =====================================================================
create or replace function nearby_hospitals(lat float, lng float, radius_km float default 25)
returns table (
  id uuid,
  name text,
  category text,
  hosp_lat float,
  hosp_lng float,
  distance_km float
)
language sql
stable
as $$
  select
    h.id,
    h.name,
    h.category,
    st_y(h.location::geometry) as hosp_lat,
    st_x(h.location::geometry) as hosp_lng,
    round((st_distance(h.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography) / 1000)::numeric, 2)::float as distance_km
  from hospitals h
  where st_dwithin(h.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc;
$$;

-- =====================================================================
-- REALTIME: broadcast new emergency alerts to the ticker
-- =====================================================================
alter publication supabase_realtime add table emergency_alerts;

-- =====================================================================
-- SEED DATA — sample hospitals, blood stock, organ counts
-- so the site isn't empty on first load. Edit freely.
-- =====================================================================
insert into hospitals (name, category, address, phone, location) values
  ('Apollo Hospitals',            'Multi-specialty',      'Jubilee Hills, Hyderabad',  '+91 40 2360 7777', st_setsrid(st_makepoint(78.4074, 17.4326), 4326)),
  ('Yashoda Hospitals',           'Transplant Center',    'Somajiguda, Hyderabad',     '+91 40 4567 4567', st_setsrid(st_makepoint(78.4569, 17.4239), 4326)),
  ('KIMS Hospital',               'Multi-specialty',      'Secunderabad, Hyderabad',   '+91 40 4488 5000', st_setsrid(st_makepoint(78.4983, 17.4399), 4326)),
  ('Care Hospitals',              'Cardiac & Transplant',  'Banjara Hills, Hyderabad', '+91 40 3041 8888', st_setsrid(st_makepoint(78.4483, 17.4126), 4326)),
  ('Continental Hospitals',       'Multi-specialty',      'Gachibowli, Hyderabad',     '+91 40 6700 0000', st_setsrid(st_makepoint(78.3489, 17.4239), 4326))
on conflict do nothing;

insert into blood_inventory (hospital_id, blood_group, units_available)
select h.id, bg, (random()*40 + 5)::int
from hospitals h, unnest(array['A+','A-','B+','B-','AB+','AB-','O+','O-']) as bg
on conflict (hospital_id, blood_group) do nothing;

insert into organ_availability (hospital_id, organ_type, donors_available)
select h.id, ot, (random()*15)::int
from hospitals h, unnest(array['Heart','Lungs','Liver','Kidney','Eye','Bone Marrow','Pancreas','Brain']) as ot
on conflict (hospital_id, organ_type) do nothing;

-- =====================================================================
-- DONE. Verify in Supabase → Table Editor that all tables above exist.
-- =====================================================================
