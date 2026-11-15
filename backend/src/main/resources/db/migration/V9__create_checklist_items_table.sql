-- Tạo bảng app.checklist_items (Quản lý danh sách hành lý cần chuẩn bị của chuyến đi)
CREATE TABLE IF NOT EXISTS app.checklist_items (
    item_id         BIGSERIAL PRIMARY KEY,
    trip_id         BIGINT NOT NULL,

    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL DEFAULT 'Cá nhân',
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_checklist_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(trip_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_checklist_name_nonempty
        CHECK (BTRIM(name) <> '')
);

CREATE INDEX IF NOT EXISTS idx_checklist_trip_id
    ON app.checklist_items(trip_id, item_id ASC);

DROP TRIGGER IF EXISTS trg_checklist_items_updated_at ON app.checklist_items;
CREATE TRIGGER trg_checklist_items_updated_at
    BEFORE UPDATE ON app.checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at();
