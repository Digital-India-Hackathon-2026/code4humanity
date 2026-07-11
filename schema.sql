CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('donor', 'doctor', 'admin');
CREATE TYPE request_type AS ENUM ('blood', 'organ');
CREATE TYPE request_status AS ENUM ('open', 'matched', 'fulfilled', 'cancelled', 'expired');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  blood_group TEXT,
  is_organ_donor BOOLEAN NOT NULL DEFAULT FALSE,
  role user_role NOT NULL DEFAULT 'donor',
  is_doctor BOOLEAN NOT NULL DEFAULT FALSE,
  hospital_name TEXT,
  nmr_id TEXT,
  doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
  age INTEGER,
  gender gender_type,
  has_health_condition BOOLEAN NOT NULL DEFAULT FALSE,
  health_issues TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  location GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group TEXT,
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type request_type NOT NULL,
  blood_group TEXT,
  organ_type TEXT,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  status request_status NOT NULL DEFAULT 'open',
  location GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  radius_km NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_location_idx ON profiles USING GIST (location);
CREATE INDEX requests_location_idx ON requests USING GIST (location);
CREATE INDEX hospitals_location_idx ON hospitals USING GIST (location);
CREATE INDEX blood_banks_location_idx ON blood_banks USING GIST (location);
CREATE INDEX requests_status_idx ON requests (status);
CREATE INDEX profiles_blood_group_idx ON profiles (blood_group);
CREATE INDEX profiles_is_doctor_idx ON profiles (is_doctor);

CREATE OR REPLACE FUNCTION nearby_donors(
  target_blood_group TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  blood_group TEXT,
  phone TEXT,
  donor_lat DOUBLE PRECISION,
  donor_lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
  SELECT
    p.id,
    p.full_name,
    p.blood_group,
    p.phone,
    ST_Y(p.location::geometry) AS donor_lat,
    ST_X(p.location::geometry) AS donor_lng,
    ST_Distance(p.location, ST_MakePoint(lng, lat)::geography) / 1000 AS distance_km
  FROM profiles p
  WHERE p.location IS NOT NULL
    AND p.is_available = TRUE
    AND (target_blood_group IS NULL OR p.blood_group = target_blood_group)
    AND ST_DWithin(p.location, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  ORDER BY distance_km ASC
  LIMIT 100;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION nearby_hospitals(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  phone TEXT,
  hospital_lat DOUBLE PRECISION,
  hospital_lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
  SELECT
    h.id,
    h.name,
    h.address,
    h.phone,
    ST_Y(h.location::geometry) AS hospital_lat,
    ST_X(h.location::geometry) AS hospital_lng,
    ST_Distance(h.location, ST_MakePoint(lng, lat)::geography) / 1000 AS distance_km
  FROM hospitals h
  WHERE ST_DWithin(h.location, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  ORDER BY distance_km ASC
  LIMIT 100;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION nearby_blood_banks(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  phone TEXT,
  bank_lat DOUBLE PRECISION,
  bank_lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
  SELECT
    b.id,
    b.name,
    b.address,
    b.phone,
    ST_Y(b.location::geometry) AS bank_lat,
    ST_X(b.location::geometry) AS bank_lng,
    ST_Distance(b.location, ST_MakePoint(lng, lat)::geography) / 1000 AS distance_km
  FROM blood_banks b
  WHERE ST_DWithin(b.location, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  ORDER BY distance_km ASC
  LIMIT 100;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER requests_set_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
