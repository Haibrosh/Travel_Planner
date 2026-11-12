package com.travel.planner.repository;

import com.travel.planner.model.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

    @Query(value = """
            SELECT
                p.place_id AS "placeId",
                p.source,
                p.source_id AS "sourceId",
                p.name,
                p.category,
                p.subcategory,
                p.address,
                p.phone,
                p.website,
                p.opening_hours AS "openingHours",
                p.latitude,
                p.longitude,
                p.province_code AS "provinceCode",
                d.name AS "provinceName",
                d.slug AS "provinceSlug",
                p.rating,
                p.review_count AS "reviewCount",
                p.photo_url AS "photoUrl",
                r.ranking_score AS "rankingScore",
                (c.place_id IS NOT NULL) AS "hasContent",
                c.language AS "contentLanguage"
            FROM analytics.places_v2 p
            LEFT JOIN analytics.destinations_v2 d ON p.province_code = d.province_code
            LEFT JOIN analytics.place_rankings r ON r.place_id = p.place_id
            LEFT JOIN analytics.place_contents c ON c.place_id = p.place_id
            WHERE (CAST(:keyword AS text) IS NULL OR (
                p.name % CAST(:keyword AS text)
                OR p.name ILIKE CONCAT('%', CAST(:keyword AS text), '%')
            ))
            AND (CAST(:destinationId AS text) IS NULL OR p.province_code = CAST(:destinationId AS text) OR d.slug = CAST(:destinationId AS text))
            AND (CAST(:category AS text) IS NULL OR p.category = CAST(:category AS text))
            ORDER BY
                CASE WHEN CAST(:sort AS text) = 'name_asc' THEN p.name END ASC,
                CASE WHEN CAST(:sort AS text) = 'name_desc' THEN p.name END DESC,
                CASE WHEN CAST(:sort AS text) = 'rating_asc' THEN p.rating END ASC NULLS LAST,
                CASE WHEN CAST(:sort AS text) = 'rating_desc' THEN p.rating END DESC NULLS LAST,
                CASE
                    WHEN CAST(:keyword AS text) IS NOT NULL AND p.name ILIKE CONCAT(CAST(:keyword AS text), '%') THEN 0
                    WHEN CAST(:keyword AS text) IS NOT NULL AND p.name ILIKE CONCAT('%', CAST(:keyword AS text), '%') THEN 1
                    ELSE 2
                END ASC,
                r.ranking_score DESC NULLS LAST,
                r.review_part DESC NULLS LAST,
                p.place_id ASC
            """,
            countQuery = """
            SELECT COUNT(p.place_id)
            FROM analytics.places_v2 p
            LEFT JOIN analytics.destinations_v2 d ON p.province_code = d.province_code
            WHERE (CAST(:keyword AS text) IS NULL OR (
                p.name % CAST(:keyword AS text)
                OR p.name ILIKE CONCAT('%', CAST(:keyword AS text), '%')
            ))
            AND (CAST(:destinationId AS text) IS NULL OR p.province_code = CAST(:destinationId AS text) OR d.slug = CAST(:destinationId AS text))
            AND (CAST(:category AS text) IS NULL OR p.category = CAST(:category AS text))
            """,
            nativeQuery = true)
    Page<PlaceProjection> searchPlaces(
            @Param("keyword") String keyword,
            @Param("destinationId") String destinationId,
            @Param("category") String category,
            @Param("sort") String sort,
            Pageable pageable
    );

    @Query(value = """
            SELECT
                p.place_id AS "placeId",
                p.source,
                p.source_id AS "sourceId",
                p.name,
                p.category,
                p.subcategory,
                p.address,
                p.phone,
                p.website,
                p.opening_hours AS "openingHours",
                p.latitude,
                p.longitude,
                p.province_code AS "provinceCode",
                d.name AS "provinceName",
                d.slug AS "provinceSlug",
                p.rating,
                p.review_count AS "reviewCount",
                p.photo_url AS "photoUrl",
                r.ranking_score AS "rankingScore",
                r.subcat_part AS "subcatPart",
                r.wiki_part AS "wikiPart",
                r.rating_part AS "ratingPart",
                r.review_part AS "reviewPart",
                r.formula_version AS "formulaVersion",
                (c.place_id IS NOT NULL) AS "hasContent",
                c.language AS "contentLanguage",
                c.content_source AS "contentSource",
                c.wikidata_id AS "wikidataId",
                c.source_title AS "sourceTitle",
                c.source_wiki_url AS "sourceWikiUrl",
                c.revision_id AS "revisionId",
                c.summary AS "contentSummary",
                c.description_md AS "contentDescriptionMd",
                c.license AS "contentLicense",
                c.attribution AS "contentAttribution",
                c.updated_at AS "contentUpdatedAt"
            FROM analytics.places_v2 p
            LEFT JOIN analytics.destinations_v2 d ON d.province_code = p.province_code
            LEFT JOIN analytics.place_rankings r ON r.place_id = p.place_id
            LEFT JOIN analytics.place_contents c ON c.place_id = p.place_id
            WHERE p.place_id = :placeId
            """, nativeQuery = true)
    Optional<PlaceProjection> findPlaceDetailById(@Param("placeId") Long placeId);

    @Query(value = """
            SELECT
                p.place_id AS "placeId",
                p.source,
                p.source_id AS "sourceId",
                p.name,
                p.category,
                p.subcategory,
                p.address,
                p.phone,
                p.website,
                p.opening_hours AS "openingHours",
                p.latitude,
                p.longitude,
                p.province_code AS "provinceCode",
                d.name AS "provinceName",
                d.slug AS "provinceSlug",
                p.rating,
                p.review_count AS "reviewCount",
                p.photo_url AS "photoUrl",
                r.ranking_score AS "rankingScore",
                (c.place_id IS NOT NULL) AS "hasContent",
                c.language AS "contentLanguage"
            FROM analytics.places_v2 p
            INNER JOIN analytics.destinations_v2 d ON d.province_code = p.province_code
            INNER JOIN analytics.place_rankings r ON r.place_id = p.place_id
            LEFT JOIN analytics.place_contents c ON c.place_id = p.place_id
            WHERE (d.slug = :provinceSlugOrCode OR d.province_code = :provinceSlugOrCode)
              AND (:category = 'all' OR p.category = :category)
            ORDER BY
                r.ranking_score DESC,
                r.review_part DESC,
                p.place_id ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<PlaceProjection> findRecommendations(
            @Param("provinceSlugOrCode") String provinceSlugOrCode,
            @Param("category") String category,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT
                p.place_id AS "placeId",
                p.source,
                p.source_id AS "sourceId",
                p.name,
                p.category,
                p.subcategory,
                p.address,
                p.phone,
                p.website,
                p.opening_hours AS "openingHours",
                p.province_code AS "provinceCode",
                d.name AS "provinceName",
                d.slug AS "provinceSlug",
                p.latitude,
                p.longitude,
                p.rating,
                p.review_count AS "reviewCount",
                p.photo_url AS "photoUrl",
                r.ranking_score AS "rankingScore",
                ROUND(similarity(p.name, :q)::numeric, 4) AS "textSimilarity",
                ROUND((0.55 * similarity(p.name, :q) + 0.45 * r.ranking_score)::numeric, 4) AS "combinedSearchScore",
                (c.place_id IS NOT NULL) AS "hasContent",
                c.language AS "contentLanguage"
            FROM analytics.places_v2 p
            INNER JOIN analytics.place_rankings r ON r.place_id = p.place_id
            INNER JOIN analytics.destinations_v2 d ON d.province_code = p.province_code
            LEFT JOIN analytics.place_contents c ON c.place_id = p.place_id
            WHERE (
                    p.name ILIKE '%' || :q || '%'
                    OR similarity(p.name, :q) >= 0.25
                  )
              AND (CAST(:provinceCode AS text) IS NULL OR p.province_code = CAST(:provinceCode AS text))
              AND (CAST(:category AS text) IS NULL OR p.category = CAST(:category AS text))
            ORDER BY
                (p.name ILIKE :q || '%') DESC,
                "combinedSearchScore" DESC,
                r.ranking_score DESC,
                p.place_id ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<PlaceProjection> searchPlacesHybrid(
            @Param("q") String q,
            @Param("provinceCode") String provinceCode,
            @Param("category") String category,
            @Param("limit") int limit
    );

    @Query(value = """
            SELECT
                p.place_id AS "placeId",
                p.source,
                p.source_id AS "sourceId",
                p.name,
                p.category,
                p.subcategory,
                p.address,
                p.phone,
                p.website,
                p.opening_hours AS "openingHours",
                p.latitude,
                p.longitude,
                p.province_code AS "provinceCode",
                d.name AS "provinceName",
                d.slug AS "provinceSlug",
                p.rating,
                p.review_count AS "reviewCount",
                p.photo_url AS "photoUrl",
                r.ranking_score AS "rankingScore",
                ROUND(
                    ST_Distance(
                        p.geometry::geography,
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                    )::numeric,
                    1
                ) AS "distanceMeters",
                (c.place_id IS NOT NULL) AS "hasContent",
                c.language AS "contentLanguage"
            FROM analytics.places_v2 p
            INNER JOIN analytics.place_rankings r ON r.place_id = p.place_id
            LEFT JOIN analytics.destinations_v2 d ON d.province_code = p.province_code
            LEFT JOIN analytics.place_contents c ON c.place_id = p.place_id
            WHERE p.geometry && ST_Expand(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :radiusMeters / 111320.0)
              AND ST_DWithin(
                    p.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                    :radiusMeters
                  )
              AND (CAST(:category AS text) IS NULL OR p.category = CAST(:category AS text))
              AND (CAST(:excludePlaceId AS bigint) IS NULL OR p.place_id <> CAST(:excludePlaceId AS bigint))
            ORDER BY
                r.ranking_score DESC,
                "distanceMeters" ASC,
                p.place_id ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<PlaceProjection> findNearbyPlaces(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("radiusMeters") int radiusMeters,
            @Param("category") String category,
            @Param("excludePlaceId") Long excludePlaceId,
            @Param("limit") int limit
    );
}
