-- ============================================================
-- LifeLink — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Matches the sb.from()/sb.rpc() calls already present in app.js
-- ============================================================

-- Needed for geography (lat/lng distance) columns + gen_random_uuid()
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ============================================================
-- 1. PROFILES  (donors, hospitals-as-users, admins)
--    id matches auth.users.id — created automatically on signup
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  blood_group text,
  is_organ_donor boolean default false,
  role text not null default 'donor' check (role in ('donor','recipient','hospital','admin')),
  location geography(Point, 4326),
  verified boolean default false,
  availability_status text default 'available' check (availability_status in ('available','unavailable')),
  last_donation_date date,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. HOSPITALS
-- ============================================================
create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_number text,
  contact_person text,
  phone text,
  email text,
  address text,
  category text,               -- e.g. 'Blood Bank', 'Multi-specialty'
  location geography(Point, 4326),
  verified boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. DONATIONS  (history — used for the "My donations" count)
-- ============================================================
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references profiles(id) on delete cascade,
  type text check (type in ('blood','organ')),
  organ_type text,
  hospital_id uuid references hospitals(id),
  donation_date date default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- 4. REQUESTS  (blood + organ requests, incl. SOS)
-- ============================================================
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  request_type text not null check (request_type in ('blood','organ')),
  blood_group text,
  organ_type text,
  urgency text check (urgency in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','matched','fulfilled','cancelled','expired')),
  location geography(Point, 4326),
  created_at timestamptz default now()
);

-- ============================================================
-- 5. EMERGENCY ALERTS  (SOS broadcasts, realtime ticker source)
-- ============================================================
create table if not exists emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  triggered_by uuid references profiles(id),
  radius_km numeric default 10,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. TRIGGER — auto-create a profile row on signup
--    Reads the metadata passed in sb.auth.signUp({ options: { data: {...} } })
-- ============================================================
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
    coalesce(new.raw_user_meta_data->>'role', 'donor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 7. RPC — nearby_donors
--    Called as: sb.rpc('nearby_donors', { target_blood_group, lat, lng, radius_km })
--    SECURITY DEFINER so it can search across all profiles even though
--    profiles table itself stays locked down by RLS (see below).
-- ============================================================
create or replace function nearby_donors(
  target_blood_group text,
  lat double precision,
  lng double precision,
  radius_km double precision
)
returns table (
  id uuid,
  full_name text,
  blood_group text,
  donor_lat double precision,
  donor_lng double precision,
  distance_km double precision
)
language sql
security definer set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.blood_group,
    st_y(p.location::geometry) as donor_lat,
    st_x(p.location::geometry) as donor_lng,
    st_distance(p.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography) / 1000.0 as distance_km
  from profiles p
  where p.role = 'donor'
    and p.blood_group = target_blood_group
    and p.availability_status = 'available'
    and p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

-- ============================================================
-- 8. RPC — nearby_hospitals
--    Called as: sb.rpc('nearby_hospitals', { lat, lng, radius_km })
-- ============================================================
create or replace function nearby_hospitals(
  lat double precision,
  lng double precision,
  radius_km double precision
)
returns table (
  id uuid,
  name text,
  category text,
  hosp_lat double precision,
  hosp_lng double precision,
  distance_km double precision
)
language sql
security definer set search_path = public
as $$
  select
    h.id,
    h.name,
    h.category,
    st_y(h.location::geometry) as hosp_lat,
    st_x(h.location::geometry) as hosp_lng,
    st_distance(h.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography) / 1000.0 as distance_km
  from hospitals h
  where h.location is not null
    and st_dwithin(h.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

-- ============================================================
-- 9. ROW LEVEL SECURITY
--    Search happens via the SECURITY DEFINER RPCs above, so direct
--    table access can stay tight without breaking donor search.
-- ============================================================
alter table profiles enable row level security;
alter table hospitals enable row level security;
alter table donations enable row level security;
alter table requests enable row level security;
alter table emergency_alerts enable row level security;

-- profiles: users can read/update only their own row
create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- hospitals: public read (used to render hospital list/map), no public write
create policy "hospitals: public read" on hospitals
  for select using (true);

-- donations: donor can read their own history
create policy "donations: read own" on donations
  for select using (auth.uid() = donor_id);

-- requests: any authenticated user can create their own request,
-- and the dashboard needs to read all requests + update status.
-- (Kept permissive for the hackathon demo — tighten to role='hospital' /
--  role='admin' on update once you have role-checking in place.)
create policy "requests: insert own" on requests
  for insert with check (auth.uid() = requester_id);
create policy "requests: read all (authenticated)" on requests
  for select using (auth.role() = 'authenticated');
create policy "requests: update status (authenticated)" on requests
  for update using (auth.role() = 'authenticated');

-- emergency_alerts: public read (powers the live SOS ticker, which runs
-- even before login), insert only by the person who triggered it.
create policy "emergency_alerts: public read" on emergency_alerts
  for select using (true);
create policy "emergency_alerts: insert own" on emergency_alerts
  for insert with check (auth.uid() = triggered_by);

-- ============================================================
-- 10. REALTIME — enable postgres_changes broadcasts for the SOS ticker
-- ============================================================
alter publication supabase_realtime add table emergency_alerts;

-- ============================================================
-- Done. After running this:
-- 1. Supabase Dashboard → Authentication → Providers → Email:
--    turn OFF "Confirm email" for faster hackathon demo signups (optional)
-- 2. Insert 2-3 rows into `hospitals` manually so the map/search has data
-- 3. Test signup -> a matching row should appear in `profiles` automatically
-- ============================================================
