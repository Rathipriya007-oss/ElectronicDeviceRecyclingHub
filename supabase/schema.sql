-- =============================================================================
-- Intelligent E-Waste Recycling Hub — Supabase Schema
-- =============================================================================
-- Run this entire file in the Supabase SQL Editor (Database → SQL Editor → New query).
-- Order matters: extensions → tables → indexes → functions → RLS → storage → seed.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;


-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- 1a. profiles — one row per authenticated user, mirrors auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  address       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- 1b. recyclers — the 10 Erode recyclers (and any future ones)
CREATE TABLE IF NOT EXISTS public.recyclers (
  id                         TEXT PRIMARY KEY,                  -- e.g. "rec-erode-01"
  name                       TEXT        NOT NULL,
  organization               TEXT        NOT NULL,
  tagline                    TEXT,
  verified                   BOOLEAN     NOT NULL DEFAULT FALSE,
  cpcb_reg_number            TEXT,
  r2_certified               BOOLEAN     NOT NULL DEFAULT FALSE,
  iso_certified              BOOLEAN     NOT NULL DEFAULT FALSE,
  rating                     NUMERIC(3,2),
  review_count               INTEGER     NOT NULL DEFAULT 0,
  -- PostGIS geography point: ST_MakePoint(lng, lat)
  location                   GEOGRAPHY(POINT, 4326) NOT NULL,
  address                    TEXT        NOT NULL,
  locality                   TEXT,
  base_offer_multiplier      NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  accepted_categories        TEXT[]      NOT NULL DEFAULT '{}',
  contact_phone              TEXT,
  turnaround_time            TEXT,
  data_destruction_guarantee BOOLEAN     NOT NULL DEFAULT FALSE,
  avatar_url                 TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 1c. devices — scanned / assessed e-waste items owned by a user
CREATE TABLE IF NOT EXISTS public.devices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                     TEXT        NOT NULL,
  category                 TEXT        NOT NULL,   -- smartphone | laptop | tablet | pc_component | audio | other
  brand                    TEXT,
  model                    TEXT,
  image_url                TEXT,
  grade                    CHAR(1),                -- A | B | C | D
  grade_description        TEXT,
  confidence               NUMERIC(5,2),           -- assessment confidence %
  estimated_value_min      NUMERIC(10,2),
  estimated_value_max      NUMERIC(10,2),
  detected_issues          JSONB       NOT NULL DEFAULT '[]',
  materials                JSONB       NOT NULL DEFAULT '{}',
  co2_saved_kg             NUMERIC(8,3),
  toxic_waste_diverted_kg  NUMERIC(8,3),
  status                   TEXT        NOT NULL DEFAULT 'scanned',
  -- status: scanned | scheduled_pickup | in_transit | recycled | payout_completed
  selected_recycler_id     TEXT        REFERENCES public.recyclers(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT devices_status_check CHECK (
    status IN ('scanned','scheduled_pickup','in_transit','recycled','payout_completed')
  ),
  CONSTRAINT devices_category_check CHECK (
    category IN ('smartphone','laptop','tablet','pc_component','audio','other')
  ),
  CONSTRAINT devices_grade_check CHECK (grade IN ('A','B','C','D'))
);

CREATE TRIGGER devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- 1d. pickups — a scheduled pickup order linking a device to a recycler
CREATE TABLE IF NOT EXISTS public.pickups (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id                UUID        NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  recycler_id              TEXT        NOT NULL REFERENCES public.recyclers(id),
  pickup_date              DATE        NOT NULL,
  time_slot                TEXT        NOT NULL,   -- e.g. "10:00 AM - 12:00 PM"
  pickup_address           TEXT        NOT NULL,
  status                   TEXT        NOT NULL DEFAULT 'scheduled',
  -- status: scheduled | on_the_way | collected | paid
  final_payout             NUMERIC(10,2),
  route_stops              JSONB       NOT NULL DEFAULT '[]',
  total_distance_km        NUMERIC(8,2),
  batch_carbon_saving_kg   NUMERIC(8,3),
  tracking_number          TEXT        UNIQUE,
  certificate_id           TEXT        UNIQUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pickups_status_check CHECK (
    status IN ('scheduled','on_the_way','collected','paid')
  )
);

CREATE TRIGGER pickups_updated_at
  BEFORE UPDATE ON public.pickups
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- 1e. pickup_status_events — append-only audit log of every status change
CREATE TABLE IF NOT EXISTS public.pickup_status_events (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pickup_id   UUID        NOT NULL REFERENCES public.pickups(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT        NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- auto-log status transitions on pickups
CREATE OR REPLACE FUNCTION public.log_pickup_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.pickup_status_events (pickup_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER pickup_status_logger
  AFTER UPDATE ON public.pickups
  FOR EACH ROW EXECUTE PROCEDURE public.log_pickup_status_change();


-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

-- GIST index for fast spatial queries on recyclers.location
CREATE INDEX IF NOT EXISTS recyclers_location_gist
  ON public.recyclers USING GIST (location);

-- Composite index for user-scoped device lookups
CREATE INDEX IF NOT EXISTS devices_user_id_created_at
  ON public.devices (user_id, created_at DESC);

-- Composite index for user-scoped pickup lookups
CREATE INDEX IF NOT EXISTS pickups_user_id_created_at
  ON public.pickups (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pickup_status_events_pickup_id
  ON public.pickup_status_events (pickup_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- 3. RPC: nearby_recyclers
-- ---------------------------------------------------------------------------
-- Returns recyclers within radius_km of (lat, lng), ordered by distance.
-- Usage: SELECT * FROM nearby_recyclers(11.3345, 77.7015, 20);
CREATE OR REPLACE FUNCTION public.nearby_recyclers(
  lat       DOUBLE PRECISION,
  lng       DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id                         TEXT,
  name                       TEXT,
  organization               TEXT,
  tagline                    TEXT,
  verified                   BOOLEAN,
  cpcb_reg_number            TEXT,
  r2_certified               BOOLEAN,
  iso_certified              BOOLEAN,
  rating                     NUMERIC,
  review_count               INTEGER,
  lat_out                    DOUBLE PRECISION,
  lng_out                    DOUBLE PRECISION,
  address                    TEXT,
  locality                   TEXT,
  distance_km                DOUBLE PRECISION,
  base_offer_multiplier      NUMERIC,
  accepted_categories        TEXT[],
  contact_phone              TEXT,
  turnaround_time            TEXT,
  data_destruction_guarantee BOOLEAN,
  avatar_url                 TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    r.id,
    r.name,
    r.organization,
    r.tagline,
    r.verified,
    r.cpcb_reg_number,
    r.r2_certified,
    r.iso_certified,
    r.rating,
    r.review_count,
    ST_Y(r.location::geometry)           AS lat_out,
    ST_X(r.location::geometry)           AS lng_out,
    r.address,
    r.locality,
    ROUND(
      (ST_Distance(
        r.location,
        ST_MakePoint(lng, lat)::geography
      ) / 1000.0)::NUMERIC, 1
    )::DOUBLE PRECISION                  AS distance_km,
    r.base_offer_multiplier,
    r.accepted_categories,
    r.contact_phone,
    r.turnaround_time,
    r.data_destruction_guarantee,
    r.avatar_url
  FROM public.recyclers r
  WHERE ST_DWithin(
    r.location,
    ST_MakePoint(lng, lat)::geography,
    radius_km * 1000          -- ST_DWithin uses metres for geography
  )
  ORDER BY distance_km ASC;
$$;


-- ---------------------------------------------------------------------------
-- 4. Row-Level Security (RLS)
-- ---------------------------------------------------------------------------

-- profiles: users can read and update only their own row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- recyclers: publicly readable, no authenticated write (managed via service role / migrations)
ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recyclers: public read"
  ON public.recyclers FOR SELECT
  USING (TRUE);


-- devices: users access only their own devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices: owner select"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "devices: owner insert"
  ON public.devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "devices: owner update"
  ON public.devices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "devices: owner delete"
  ON public.devices FOR DELETE
  USING (auth.uid() = user_id);


-- pickups: users access only their own pickup orders
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pickups: owner select"
  ON public.pickups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "pickups: owner insert"
  ON public.pickups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pickups: owner update"
  ON public.pickups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pickups: owner delete"
  ON public.pickups FOR DELETE
  USING (auth.uid() = user_id);


-- pickup_status_events: users can only read events for their own pickups
ALTER TABLE public.pickup_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pickup_status_events: owner select"
  ON public.pickup_status_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pickups p
      WHERE p.id = pickup_id AND p.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 5. Storage — "device-photos" private bucket policies
-- ---------------------------------------------------------------------------
-- Create the bucket (idempotent via ON CONFLICT; you can also do this in the Dashboard).
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-photos', 'device-photos', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Users can upload photos only into their own folder: device-photos/<uid>/*
CREATE POLICY "device-photos: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'device-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can read their own photos
CREATE POLICY "device-photos: owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'device-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can replace/update their own photos
CREATE POLICY "device-photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'device-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can delete their own photos
CREATE POLICY "device-photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'device-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );


-- ---------------------------------------------------------------------------
-- 6. Seed data — 10 Erode recyclers (matches recyclersData.ts exactly)
-- ---------------------------------------------------------------------------
INSERT INTO public.recyclers (
  id, name, organization, tagline, verified, cpcb_reg_number,
  r2_certified, iso_certified, rating, review_count,
  location, address, locality,
  base_offer_multiplier, accepted_categories,
  contact_phone, turnaround_time, data_destruction_guarantee, avatar_url
) VALUES

-- rec-erode-01
(
  'rec-erode-01',
  'EcoCircuits GreenTek Facility',
  'EcoCircuits Sustainable Solutions Ltd.',
  'TNPCB & CPCB Authorized Tier-1 E-Waste Refiner',
  TRUE, 'CPCB/EW-TN/ERD/2023/8812',
  TRUE, TRUE, 4.9, 342,
  ST_MakePoint(77.7245, 11.3458),
  '74/2, Brough Road, Near Clock Tower, Erode 638001',
  'Brough Road',
  1.12,
  ARRAY['smartphone','laptop','tablet','pc_component','audio'],
  '+91 94421 88392', 'Same-day doorstep collection', TRUE,
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-02
(
  'rec-erode-02',
  'Surampatti CleanTech Recovery Hub',
  'CleanTech Circular Economy India',
  'Specialized in battery neutralisation & rare-earth recovery',
  TRUE, 'CPCB/EW-TN/ERD/2022/6104',
  TRUE, TRUE, 4.8, 219,
  ST_MakePoint(77.7105, 11.3282),
  '128, Surampatti Four Roads, Near Railway Colony, Erode 638009',
  'Surampatti',
  1.08,
  ARRAY['smartphone','laptop','tablet','pc_component'],
  '+91 98430 45210', 'Within 4 hours', TRUE,
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-03
(
  'rec-erode-03',
  'Kasipalayam Urban Miners & Scrap',
  'Urban Mine Tech Consortium',
  'Zero-landfill certified electronics dismantling center',
  TRUE, 'CPCB/EW-TN/ERD/2024/9021',
  FALSE, TRUE, 4.7, 154,
  ST_MakePoint(77.7352, 11.3215),
  '45, Industrial Estate Road, Kasipalayam, Erode 638002',
  'Kasipalayam',
  1.04,
  ARRAY['smartphone','laptop','pc_component'],
  '+91 97871 33499', 'Next day scheduled pickup', TRUE,
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-04
(
  'rec-erode-04',
  'Chithode Mega E-Waste Processing Plant',
  'Kongu EcoVenture Recyclers Pvt Ltd',
  'Automated PCB shredding & metallurgical extraction',
  TRUE, 'CPCB/EW-TN/ERD/2021/4198',
  TRUE, TRUE, 4.9, 489,
  ST_MakePoint(77.6742, 11.4125),
  'NH 544 Salem-Coimbatore Highway, Chithode Bypass, Erode 638102',
  'Chithode',
  1.15,
  ARRAY['smartphone','laptop','tablet','pc_component','audio','other'],
  '+91 94432 99801', 'Scheduled smart batch route', TRUE,
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-05
(
  'rec-erode-05',
  'Perundurai SIPCOT EcoRecycle Park',
  'SIPCOT Industrial Resource Recovery Corp',
  'Largest heavy electronic & enterprise server recycling hub',
  TRUE, 'CPCB/EW-TN/PRD/2020/3012',
  TRUE, TRUE, 4.8, 620,
  ST_MakePoint(77.5855, 11.2755),
  'Plot B-14, SIPCOT Industrial Growth Estate, Perundurai 638052',
  'Perundurai',
  1.14,
  ARRAY['smartphone','laptop','pc_component','audio','other'],
  '+91 98427 11400', 'Scheduled eco-shuttle', TRUE,
  'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-06
(
  'rec-erode-06',
  'Bhavani RiverGreen Circular Works',
  'Cauvery Delta Clean Tech LLP',
  'High-yield gold & palladium recovery from logic boards',
  TRUE, 'CPCB/EW-TN/BHV/2023/7710',
  TRUE, TRUE, 4.85, 290,
  ST_MakePoint(77.6835, 11.4485),
  '18, Kalingarayan Canal Road, Near Sangameshwarar, Bhavani 638301',
  'Bhavani',
  1.10,
  ARRAY['smartphone','laptop','pc_component'],
  '+91 94441 55220', 'Direct courier & pickup', TRUE,
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-07
(
  'rec-erode-07',
  'Veerappanchatram ChipRevive Tech',
  'ChipRevive Circular Hardware Ltd',
  'Component salvage & certified military-grade wipe',
  TRUE, 'CPCB/EW-TN/ERD/2024/9144',
  FALSE, TRUE, 4.65, 98,
  ST_MakePoint(77.7120, 11.3620),
  '312, Sathy Main Road, Veerappanchatram, Erode 638004',
  'Veerappanchatram',
  1.05,
  ARRAY['smartphone','laptop','tablet'],
  '+91 98433 76211', 'Same-day doorstep', TRUE,
  'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-08
(
  'rec-erode-08',
  'Solar Erode Metal Recovery Station',
  'Solar Green Metals Co.',
  'Direct precious metal assay & instant UPI settlement',
  TRUE, 'CPCB/EW-TN/ERD/2023/8230',
  TRUE, TRUE, 4.75, 184,
  ST_MakePoint(77.7420, 11.2980),
  '88, Karur Bypass Road, Solar, Erode 638002',
  'Solar',
  1.09,
  ARRAY['smartphone','laptop','pc_component','audio'],
  '+91 94420 88200', 'Within 24 hours', TRUE,
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-09
(
  'rec-erode-09',
  'Thindal GreenSphere Electronics',
  'GreenSphere Environmental Network',
  'Authorized campus and residential electronic collection',
  TRUE, 'CPCB/EW-TN/ERD/2022/5501',
  TRUE, TRUE, 4.8, 312,
  ST_MakePoint(77.6790, 11.3140),
  '56, Thindal Hill Road, Near Velalar College, Erode 638012',
  'Thindal',
  1.07,
  ARRAY['smartphone','laptop','tablet','audio'],
  '+91 97890 12345', 'Within 3 hours', TRUE,
  'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=150&auto=format&fit=crop&q=80'
),

-- rec-erode-10
(
  'rec-erode-10',
  'Railway Colony Eco-Depot',
  'Southern Eco Logistics',
  'Express collection hub beside Erode Railway Junction',
  FALSE, 'CPCB/EW-TN/ERD/2024/9910',
  FALSE, TRUE, 4.5, 76,
  ST_MakePoint(77.7210, 11.3385),
  '12, Goods Shed Road, Railway Colony, Erode 638001',
  'Railway Colony',
  0.98,
  ARRAY['smartphone','laptop','pc_component'],
  '+91 93600 44102', 'Immediate walk-in or pickup', FALSE,
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80'
)

ON CONFLICT (id) DO UPDATE SET
  name                       = EXCLUDED.name,
  organization               = EXCLUDED.organization,
  tagline                    = EXCLUDED.tagline,
  verified                   = EXCLUDED.verified,
  cpcb_reg_number            = EXCLUDED.cpcb_reg_number,
  r2_certified               = EXCLUDED.r2_certified,
  iso_certified              = EXCLUDED.iso_certified,
  rating                     = EXCLUDED.rating,
  review_count               = EXCLUDED.review_count,
  location                   = EXCLUDED.location,
  address                    = EXCLUDED.address,
  locality                   = EXCLUDED.locality,
  base_offer_multiplier      = EXCLUDED.base_offer_multiplier,
  accepted_categories        = EXCLUDED.accepted_categories,
  contact_phone              = EXCLUDED.contact_phone,
  turnaround_time            = EXCLUDED.turnaround_time,
  data_destruction_guarantee = EXCLUDED.data_destruction_guarantee,
  avatar_url                 = EXCLUDED.avatar_url;


-- =============================================================================
-- Done. Paste this file into Supabase -> SQL Editor -> Run.
-- =============================================================================
