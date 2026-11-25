-- =============================================================================
-- V12: Bổ sung cột ngân sách dự kiến (budget) cho bảng app.trips
-- Cho phép NULL nếu chuyến đi chưa thiết lập ngân sách
-- =============================================================================

ALTER TABLE app.trips
    ADD COLUMN IF NOT EXISTS budget NUMERIC(15, 0) NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_trips_budget'
          AND conrelid = 'app.trips'::regclass
    ) THEN
        ALTER TABLE app.trips
            ADD CONSTRAINT chk_trips_budget
            CHECK (budget IS NULL OR budget >= 0);
    END IF;
END $$;
