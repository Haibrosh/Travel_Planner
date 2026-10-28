-- Repoint app.trips.destination_id from legacy analytics.destinations(destination_id) to analytics.destinations_v2(province_code).
-- Doi ten cot thanh destination_code (VARCHAR(2)) hoac thay the FK constraint.

-- 1. Guard kiem tra: bang analytics.destinations_v2 ton tai
DO $$
BEGIN
  IF to_regclass('analytics.destinations_v2') IS NULL THEN
    RAISE EXCEPTION 'analytics.destinations_v2 khong ton tai';
  END IF;
END $$;

-- 2. Xoa foreign key cu toi analytics.destinations
ALTER TABLE app.trips DROP CONSTRAINT IF EXISTS fk_trips_destination;

-- 3. Doi kieu du lieu cot destination_id sang VARCHAR(2) hoac tao cot province_code
-- Neu bang trips co du lieu ma truoc do la BIGINT, can convert sang VARCHAR(2)
-- Neu destination_id cu la so (vi du 1, 2) khong khop voi ma tinh 2 chu so ('01', '79'),
-- truong hop co du lieu se map hoac fallback sang tinh mac dinh, hoac neu rong thi ALTER truc tiep.
DO $$
BEGIN
  -- Kiem tra kieu du lieu hien tai cua destination_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'app' AND table_name = 'trips' AND column_name = 'destination_id' AND data_type = 'bigint'
  ) THEN
    -- Neu bang chua co du lieu hoac chuyen doi kieu:
    ALTER TABLE app.trips ALTER COLUMN destination_id TYPE VARCHAR(2) USING LPAD(destination_id::text, 2, '0');
  END IF;
END $$;

-- 4. Them foreign key moi tham chieu toi analytics.destinations_v2(province_code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_trips_destination_v2'
      AND conrelid = 'app.trips'::regclass
  ) THEN
    ALTER TABLE app.trips
      ADD CONSTRAINT fk_trips_destination_v2
      FOREIGN KEY (destination_id) REFERENCES analytics.destinations_v2 (province_code)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trips_destination_id
  ON app.trips (destination_id);

