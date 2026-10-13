-- Repoint app.itinerary_items.place_id from legacy analytics.places to analytics.places_v2.
-- Chi doi 1 FK; khong dung toi bang legacy. CHAY THU TREN DB CUC BO TRUOC.
-- Rollback: xem cuoi file.

-- 1. Guard: bang v2 ton tai, place_id la bigint, bang con rong (chi khi FK cu con ton tai)
DO $$
DECLARE n bigint; t text;
BEGIN
  IF to_regclass('analytics.places_v2') IS NULL THEN
    RAISE EXCEPTION 'analytics.places_v2 khong ton tai';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod) INTO t
  FROM pg_attribute a
  WHERE a.attrelid = 'app.itinerary_items'::regclass
    AND a.attname = 'place_id' AND NOT a.attisdropped;
  IF t IS DISTINCT FROM 'bigint' THEN
    RAISE EXCEPTION 'app.itinerary_items.place_id la %, can bigint', t;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint
             WHERE conname = 'fk_itinerary_place'
               AND conrelid = 'app.itinerary_items'::regclass) THEN
    SELECT count(*) INTO n FROM app.itinerary_items;
    IF n <> 0 THEN
      RAISE EXCEPTION 'app.itinerary_items co % dong; place_id legacy khong the chuyen sang v2 tu dong', n;
    END IF;
  END IF;
END $$;

-- 2. Bo FK cu (chi la constraint tren bang app; bang legacy khong doi)
ALTER TABLE app.itinerary_items DROP CONSTRAINT IF EXISTS fk_itinerary_place;

-- 3. Them FK moi
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'fk_itinerary_place_v2'
                   AND conrelid = 'app.itinerary_items'::regclass) THEN
    ALTER TABLE app.itinerary_items
      ADD CONSTRAINT fk_itinerary_place_v2
      FOREIGN KEY (place_id) REFERENCES analytics.places_v2 (place_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_itinerary_items_place_id
  ON app.itinerary_items (place_id);

-- 4. Kiem chung trong transaction
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint
             WHERE confrelid = 'analytics.places'::regclass) THEN
    RAISE EXCEPTION 'con FK nao do tro vao analytics.places';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'fk_itinerary_place_v2'
                   AND confrelid = 'analytics.places_v2'::regclass) THEN
    RAISE EXCEPTION 'fk_itinerary_place_v2 chua duoc tao';
  END IF;
END $$;

-- Rollback (chi an toan khi app.itinerary_items con rong):
-- BEGIN;
-- ALTER TABLE app.itinerary_items DROP CONSTRAINT IF EXISTS fk_itinerary_place_v2;
-- ALTER TABLE app.itinerary_items ADD CONSTRAINT fk_itinerary_place
--   FOREIGN KEY (place_id) REFERENCES analytics.places (place_id);
-- COMMIT;