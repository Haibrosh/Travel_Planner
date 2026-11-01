BEGIN;

-- =========================================================
-- 0. Extensions and schema
-- =========================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS analytics;


-- =========================================================
-- 1. DESTINATIONS_V2
-- 34 tỉnh/thành hiện hành
-- =========================================================

CREATE TABLE IF NOT EXISTS analytics.destinations_v2 (
    province_code   VARCHAR(2) PRIMARY KEY,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255),
    full_name       VARCHAR(255),
    area_km2        DOUBLE PRECISION,
    geometry        GEOMETRY(MultiPolygon, 4326) NOT NULL,
    source_version  VARCHAR(200),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_destinations_v2_province_code
        CHECK (province_code ~ '^[0-9]{2}$'),

    CONSTRAINT chk_destinations_v2_name_nonempty
        CHECK (BTRIM(name) <> ''),

    CONSTRAINT chk_destinations_v2_slug_nonempty
        CHECK (BTRIM(slug) <> ''),

    CONSTRAINT chk_destinations_v2_area
        CHECK (area_km2 IS NULL OR area_km2 > 0),

    CONSTRAINT chk_destinations_v2_geometry_valid
        CHECK (
            NOT ST_IsEmpty(geometry)
            AND ST_IsValid(geometry)
        )
);


-- =========================================================
-- 2. PLACES_V2
-- POI nền từ OSM; province_code tham chiếu destinations_v2
-- =========================================================

CREATE TABLE IF NOT EXISTS analytics.places_v2 (
    place_id        BIGSERIAL PRIMARY KEY,

    -- Data lineage
    source          VARCHAR(50) NOT NULL,
    source_id       VARCHAR(100) NOT NULL,
    osm_type        VARCHAR(20),
    osm_id          BIGINT,
    fetched_at      TIMESTAMPTZ NOT NULL,

    -- Basic information
    name            VARCHAR(500) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    subcategory     VARCHAR(100),

    -- Contact / metadata
    address         TEXT,
    phone           TEXT,
    website         TEXT,
    opening_hours   TEXT,

    -- Location
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    geometry        GEOMETRY(Point, 4326) NOT NULL,

    -- Administrative assignment
    province_code   VARCHAR(2) NOT NULL,
    province_method VARCHAR(20) NOT NULL,

    -- Enrichment; initially NULL until matching is performed
    rating                  NUMERIC(3,2),
    review_count            INTEGER,
    photo_url               TEXT,
    enrichment_provider     VARCHAR(50),
    enrichment_provider_id  VARCHAR(200),
    match_confidence        NUMERIC(4,3),
    enriched_at             TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One record per source object
    CONSTRAINT uq_places_v2_source_source_id
        UNIQUE (source, source_id),

    -- Relationship to the NEW 34-province table
    CONSTRAINT fk_places_v2_province
        FOREIGN KEY (province_code)
        REFERENCES analytics.destinations_v2 (province_code),

    -- Required text fields
    CONSTRAINT chk_places_v2_source_nonempty
        CHECK (BTRIM(source) <> ''),

    CONSTRAINT chk_places_v2_source_id_nonempty
        CHECK (BTRIM(source_id) <> ''),

    CONSTRAINT chk_places_v2_name_nonempty
        CHECK (BTRIM(name) <> ''),

    -- OSM identity validation
    CONSTRAINT chk_places_v2_osm_type
        CHECK (
            osm_type IS NULL
            OR osm_type IN ('node', 'way', 'relation')
        ),

    CONSTRAINT chk_places_v2_osm_id
        CHECK (osm_id IS NULL OR osm_id > 0),

    CONSTRAINT chk_places_v2_osm_identity
        CHECK (
            source <> 'osm'
            OR (
                osm_type IS NOT NULL
                AND osm_id IS NOT NULL
            )
        ),

    -- Current supported categories
    CONSTRAINT chk_places_v2_category
        CHECK (
            category IN (
                'restaurant',
                'hotel',
                'cafe',
                'attraction'
            )
        ),

    -- Coordinates
    CONSTRAINT chk_places_v2_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_places_v2_longitude
        CHECK (longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_places_v2_geometry_consistency
        CHECK (
            NOT ST_IsEmpty(geometry)
            AND ABS(ST_X(geometry) - longitude) <= 1e-9
            AND ABS(ST_Y(geometry) - latitude) <= 1e-9
        ),

    -- Province assignment
    CONSTRAINT chk_places_v2_province_method
        CHECK (province_method IN ('within', 'nearest')),

    -- Enrichment validation
    CONSTRAINT chk_places_v2_rating
        CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),

    CONSTRAINT chk_places_v2_review_count
        CHECK (review_count IS NULL OR review_count >= 0),

    CONSTRAINT chk_places_v2_match_confidence
        CHECK (
            match_confidence IS NULL
            OR match_confidence BETWEEN 0 AND 1
        )
);


-- =========================================================
-- 3. Indexes
-- =========================================================

-- Province boundary spatial queries
CREATE INDEX IF NOT EXISTS idx_destinations_v2_geometry
    ON analytics.destinations_v2
    USING GIST (geometry);

-- POI spatial search
CREATE INDEX IF NOT EXISTS idx_places_v2_geometry
    ON analytics.places_v2
    USING GIST (geometry);

-- Fuzzy name search
CREATE INDEX IF NOT EXISTS idx_places_v2_name_trgm
    ON analytics.places_v2
    USING GIN (name gin_trgm_ops);

-- Category filter
CREATE INDEX IF NOT EXISTS idx_places_v2_category
    ON analytics.places_v2 (category);

-- Province filter and province + category queries
CREATE INDEX IF NOT EXISTS idx_places_v2_province_category
    ON analytics.places_v2 (province_code, category);


-- =========================================================
-- 4. Documentation
-- =========================================================

COMMENT ON TABLE analytics.destinations_v2 IS
    'New table containing the 34 current Vietnamese provinces and municipalities. Legacy analytics.destinations remains unchanged.';

COMMENT ON TABLE analytics.places_v2 IS
    'New OSM POI table with province assignment and enrichment fields. Legacy analytics.places remains unchanged.';

COMMENT ON COLUMN analytics.places_v2.source_id IS
    'Stable source identifier, e.g. node/123, way/456, relation/789.';

COMMENT ON COLUMN analytics.places_v2.province_method IS
    'within = point falls inside a province polygon; nearest = assigned to the nearest province within the 5 km threshold.';

COMMENT ON COLUMN analytics.places_v2.fetched_at IS
    'Timestamp of the source data extraction/snapshot; must be supplied from reliable lineage metadata.';

COMMIT;