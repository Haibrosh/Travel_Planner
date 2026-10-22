BEGIN;

CREATE TABLE IF NOT EXISTS analytics.place_rankings (
    place_id        BIGINT PRIMARY KEY,

    -- Điểm tổng và các thành phần (đều chuẩn hóa về [0,1])
    ranking_score   NUMERIC(5,4) NOT NULL,
    subcat_part     NUMERIC(5,4) NOT NULL DEFAULT 0,
    wiki_part       NUMERIC(5,4) NOT NULL DEFAULT 0,
    rating_part     NUMERIC(5,4) NOT NULL DEFAULT 0,
    review_part     NUMERIC(5,4) NOT NULL DEFAULT 0,

    -- Truy vết
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

-- Backend sắp xếp theo điểm giảm dần
CREATE INDEX IF NOT EXISTS idx_place_rankings_score
    ON analytics.place_rankings (ranking_score DESC);

COMMENT ON TABLE analytics.place_rankings IS
    'Derived display-ranking score per place (one row per place_id). Recomputed by pipeline; places_v2 is not modified.';
COMMENT ON COLUMN analytics.place_rankings.formula_version IS
    'Version tag of the scoring formula, e.g. v1_20261017.';

COMMIT;