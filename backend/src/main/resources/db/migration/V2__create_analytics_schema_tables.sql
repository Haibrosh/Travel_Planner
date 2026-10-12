CREATE TABLE IF NOT EXISTS analytics.destinations (
    destination_id  BIGSERIAL PRIMARY KEY,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL
    );

CREATE TABLE IF NOT EXISTS analytics.places (
    place_id        BIGSERIAL PRIMARY KEY,

    source          VARCHAR(50) NOT NULL,
    source_id       VARCHAR(100) NOT NULL,
    fetched_at      TIMESTAMPTZ NOT NULL,

    name            VARCHAR(500) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    subcategory     VARCHAR(100),

    address         TEXT,
    phone           VARCHAR(100),
    website         TEXT,
    opening_hours   TEXT,

    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    geometry        GEOMETRY(Point, 4326) NOT NULL,

    destination_id  BIGINT NOT NULL,

    rating          NUMERIC(3,2),
    review_count    INTEGER,
    photo_url       TEXT,

    CONSTRAINT uq_places_source_source_id UNIQUE (source, source_id),
    CONSTRAINT fk_places_destination FOREIGN KEY (destination_id) REFERENCES analytics.destinations(destination_id),

    CONSTRAINT chk_places_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_places_longitude
        CHECK (longitude BETWEEN -180 AND 180)

    );

CREATE TABLE IF NOT EXISTS analytics.pipeline_log (
    pipeline_run_id       BIGSERIAL PRIMARY KEY,
    run_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source                VARCHAR(50) NOT NULL,

    records_fetched       INTEGER NOT NULL DEFAULT 0,
    records_quarantined   INTEGER NOT NULL DEFAULT 0,
    duplicates_merged     INTEGER NOT NULL DEFAULT 0,
    records_loaded        INTEGER NOT NULL DEFAULT 0,

    errors                TEXT
    );

-- Spatial search
CREATE INDEX IF NOT EXISTS idx_places_geometry
    ON analytics.places
        USING GIST (geometry);

-- Fuzzy name search
CREATE INDEX IF NOT EXISTS idx_places_name_trgm
    ON analytics.places
        USING GIN (name gin_trgm_ops);

-- Filter by destination
CREATE INDEX IF NOT EXISTS idx_places_destination
    ON analytics.places (destination_id);

-- Filter by category
CREATE INDEX IF NOT EXISTS idx_places_category
    ON analytics.places (category);

-- Common search combination
CREATE INDEX IF NOT EXISTS idx_places_destination_category
    ON analytics.places (destination_id, category);