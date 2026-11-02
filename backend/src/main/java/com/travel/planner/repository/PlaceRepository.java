package com.travel.planner.repository;

import com.travel.planner.model.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

    @Query(value = """
            SELECT p.*
            FROM analytics.places_v2 p
            LEFT JOIN analytics.destinations_v2 d ON p.province_code = d.province_code
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
                CASE WHEN CAST(:sort AS text) = 'rating_desc' OR CAST(:sort AS text) IS NULL OR CAST(:sort AS text) = '' THEN p.rating END DESC NULLS LAST,
                CASE WHEN CAST(:sort AS text) = 'rating_desc' OR CAST(:sort AS text) IS NULL OR CAST(:sort AS text) = '' THEN p.review_count END DESC NULLS LAST,
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
    Page<Place> searchPlaces(
            @Param("keyword") String keyword,
            @Param("destinationId") String destinationId,
            @Param("category") String category,
            @Param("sort") String sort,
            Pageable pageable
    );
}
