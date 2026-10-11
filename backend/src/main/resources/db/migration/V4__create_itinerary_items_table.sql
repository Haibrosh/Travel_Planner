CREATE TABLE IF NOT EXISTS app.itinerary_items (
    item_id         BIGSERIAL PRIMARY KEY,
    trip_id         BIGINT NOT NULL,
    place_id        BIGINT NOT NULL,

    day_number      INTEGER,
    position_index  DOUBLE PRECISION NOT NULL,
    start_time      TIME,
    end_time        TIME,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_itinerary_trip FOREIGN KEY (trip_id) REFERENCES app.trips(trip_id) ON DELETE CASCADE,
    CONSTRAINT fk_itinerary_place FOREIGN KEY (place_id) REFERENCES analytics.places(place_id),
    CONSTRAINT chk_itinerary_day CHECK (day_number IS NULL OR day_number > 0),
    CONSTRAINT chk_itinerary_time CHECK (start_time IS NULL OR end_time IS NULL OR end_time >= start_time)
    );

CREATE TRIGGER trg_itinerary_updated_at
    BEFORE UPDATE ON app.itinerary_items
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE INDEX idx_itinerary_trip_day_position ON app.itinerary_items(trip_id, day_number, position_index, item_id);