-- Dong bo 2 bang analytics do Data Pipeline (Van) tao vao lich su Flyway:
--   * analytics.place_rankings  <- pipeline/place_rankings_schema.sql
--   * analytics.place_contents  <- pipeline/place_contents_schema.sql
--
-- Tren DB Aiven dung chung, 2 bang nay DA TON TAI va da co du lieu (35,516 rankings / 217 contents)
-- -> moi lenh deu la IF NOT EXISTS nen migration nay la no-op, KHONG dong vao du lieu.
-- Tren DB moi (local/CI), migration se tao day du cau truc bang de Hibernate/JPA validate duoc.
--
-- Luu y: Flyway tu boc moi migration trong 1 transaction, nen bo BEGIN/COMMIT cua file pipeline goc.

-- 1. Guard: bang cha analytics.places_v2 phai ton tai (duoc pipeline nap, khong do Flyway tao)
DO $$
BEGIN
  IF to_regclass('analytics.places_v2') IS NULL THEN
    RAISE EXCEPTION 'analytics.places_v2 khong ton tai; hay nap pipeline/latest_schema.sql truoc khi chay V8';
  END IF;
END $$;

-- ============================================================================
-- 2. analytics.place_rankings (1:1 voi places_v2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics.place_rankings (
    place_id        BIGINT PRIMARY KEY,

    -- Diem tong va cac thanh phan (deu chuan hoa ve [0,1])
    ranking_score   NUMERIC(5,4) NOT NULL,
    subcat_part     NUMERIC(5,4) NOT NULL DEFAULT 0,
    wiki_part       NUMERIC(5,4) NOT NULL DEFAULT 0,
    rating_part     NUMERIC(5,4) NOT NULL DEFAULT 0,
    review_part     NUMERIC(5,4) NOT NULL DEFAULT 0,

    -- Truy vet
    formula_version VARCHAR(50)  NOT NULL,
    computed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_place_rankings_place
        FOREIGN KEY (place_id)
        REFERENCES analytics.places_v2 (place_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_place_rankings_score
        CHECK (ranking_score BETWEEN 0 AND 1),
    CONSTRAINT chk_place_rankings_parts
        CHECK (
            subcat_part BETWEEN 0 AND 1 AND wiki_part   BETWEEN 0 AND 1 AND
            rating_part BETWEEN 0 AND 1 AND review_part BETWEEN 0 AND 1
        )
);

-- Backend sap xep theo diem giam dan
CREATE INDEX IF NOT EXISTS idx_place_rankings_score
    ON analytics.place_rankings (ranking_score DESC);

COMMENT ON TABLE analytics.place_rankings IS
    'Derived display-ranking score per place (one row per place_id). Recomputed by pipeline; places_v2 is not modified.';
COMMENT ON COLUMN analytics.place_rankings.formula_version IS
    'Version tag of the scoring formula, e.g. v2_20261102_balanced.';

-- ============================================================================
-- 3. analytics.place_contents (1:0..1 voi places_v2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics.place_contents (
    place_id        BIGINT PRIMARY KEY
                    REFERENCES analytics.places_v2(place_id) ON DELETE CASCADE,
    language        VARCHAR(10)  NOT NULL,
    content_source  VARCHAR(30)  NOT NULL,
    wikidata_id     VARCHAR(32),
    source_title    TEXT         NOT NULL,
    source_wiki_url TEXT         NOT NULL,
    revision_id     BIGINT,
    summary         TEXT         NOT NULL,
    description_md  TEXT,
    license         VARCHAR(50)  NOT NULL,
    attribution     TEXT         NOT NULL,
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_pc_language_nonempty   CHECK (BTRIM(language) <> ''),
    CONSTRAINT chk_pc_source_title        CHECK (BTRIM(source_title) <> ''),
    CONSTRAINT chk_pc_source_url          CHECK (BTRIM(source_wiki_url) <> ''),
    CONSTRAINT chk_pc_summary             CHECK (BTRIM(summary) <> ''),
    CONSTRAINT chk_pc_attribution         CHECK (BTRIM(attribution) <> ''),
    CONSTRAINT chk_pc_wikidata_id         CHECK (wikidata_id IS NULL OR wikidata_id ~ '^Q[0-9]+$'),
    CONSTRAINT chk_pc_content_source      CHECK (content_source IN ('wikipedia','wikidata')),
    CONSTRAINT chk_pc_source_license      CHECK (
        (content_source = 'wikipedia' AND license = 'CC BY-SA 4.0') OR
        (content_source = 'wikidata'  AND license = 'CC0 1.0')
    )
);

COMMENT ON TABLE analytics.place_contents IS
    'Verified encyclopedia summaries and descriptions for POIs from Wikipedia (CC BY-SA 4.0) or Wikidata (CC0 1.0). One row per place_id.';
COMMENT ON COLUMN analytics.place_contents.place_id IS
    'Primary key and foreign key referencing analytics.places_v2(place_id) ON DELETE CASCADE.';
COMMENT ON COLUMN analytics.place_contents.language IS
    'Actual language code of the retrieved content (e.g., vi, en), not a static default.';
COMMENT ON COLUMN analytics.place_contents.content_source IS
    'Origin of the text content: either wikipedia or wikidata.';
COMMENT ON COLUMN analytics.place_contents.wikidata_id IS
    'Wikidata QID (matching ^Q[0-9]+$) associated with the POI, if available.';
COMMENT ON COLUMN analytics.place_contents.source_title IS
    'Canonical article title or entity label from the source.';
COMMENT ON COLUMN analytics.place_contents.source_wiki_url IS
    'Mandatory canonical Wikipedia or Wikidata URL required for CC BY-SA source attribution and provenance.';
COMMENT ON COLUMN analytics.place_contents.revision_id IS
    'Optional Wikimedia page revision ID at fetch time for auditability.';
COMMENT ON COLUMN analytics.place_contents.summary IS
    'Plain-text lead summary extracted from Wikipedia/Wikidata (never generated by LLM).';
COMMENT ON COLUMN analytics.place_contents.description_md IS
    'Optional extended Markdown description from Wikipedia.';
COMMENT ON COLUMN analytics.place_contents.license IS
    'Content license: CC BY-SA 4.0 for wikipedia, CC0 1.0 for wikidata.';
COMMENT ON COLUMN analytics.place_contents.attribution IS
    'Required human-readable attribution notice matching the license.';
COMMENT ON COLUMN analytics.place_contents.fetched_at IS
    'Timestamp when content was fetched from Wikimedia APIs.';
COMMENT ON COLUMN analytics.place_contents.updated_at IS
    'Timestamp when this record was last inserted or updated.';

-- 4. Kiem chung: ca 2 bang da ton tai sau migration
DO $$
BEGIN
  IF to_regclass('analytics.place_rankings') IS NULL THEN
    RAISE EXCEPTION 'analytics.place_rankings chua duoc tao';
  END IF;
  IF to_regclass('analytics.place_contents') IS NULL THEN
    RAISE EXCEPTION 'analytics.place_contents chua duoc tao';
  END IF;
END $$;
