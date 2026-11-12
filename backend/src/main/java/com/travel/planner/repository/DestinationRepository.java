package com.travel.planner.repository;

import com.travel.planner.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, String> {

    Optional<Destination> findBySlug(String slug);

    @Query(value = """
            SELECT
                d.province_code AS "provinceCode",
                d.slug,
                d.name,
                d.name_en AS "nameEn",
                d.full_name AS "fullName",
                ROUND(d.area_km2::numeric, 2) AS "areaKm2",
                ROUND(ST_Y(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLat",
                ROUND(ST_X(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLon",
                ROUND(ST_X(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLng",
                ROUND(ST_YMin(d.geometry)::numeric, 6) AS "bboxMinLat",
                ROUND(ST_XMin(d.geometry)::numeric, 6) AS "bboxMinLon",
                ROUND(ST_YMax(d.geometry)::numeric, 6) AS "bboxMaxLat",
                ROUND(ST_XMax(d.geometry)::numeric, 6) AS "bboxMaxLon",
                COUNT(p.place_id) AS "poiCount",
                COUNT(p.place_id) FILTER (WHERE p.category = 'attraction') AS "attractionCount"
            FROM analytics.destinations_v2 d
            LEFT JOIN analytics.places_v2 p
                ON p.province_code = d.province_code
            GROUP BY
                d.province_code, d.slug, d.name, d.name_en, d.full_name, d.area_km2, d.geometry
            ORDER BY "poiCount" DESC, d.province_code ASC
            """, nativeQuery = true)
    List<DestinationProjection> findAllDestinationsWithCentroid();

    @Query(value = """
            SELECT
                d.province_code AS "provinceCode",
                d.slug,
                d.name,
                d.name_en AS "nameEn",
                d.full_name AS "fullName",
                ROUND(d.area_km2::numeric, 2) AS "areaKm2",
                ROUND(ST_Y(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLat",
                ROUND(ST_X(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLon",
                ROUND(ST_X(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLng",
                ROUND(ST_YMin(d.geometry)::numeric, 6) AS "bboxMinLat",
                ROUND(ST_XMin(d.geometry)::numeric, 6) AS "bboxMinLon",
                ROUND(ST_YMax(d.geometry)::numeric, 6) AS "bboxMaxLat",
                ROUND(ST_XMax(d.geometry)::numeric, 6) AS "bboxMaxLon",
                COUNT(p.place_id) AS "poiCount",
                COUNT(p.place_id) FILTER (WHERE p.category = 'attraction') AS "attractionCount"
            FROM analytics.destinations_v2 d
            LEFT JOIN analytics.places_v2 p
                ON p.province_code = d.province_code
            WHERE d.slug = :slug OR d.province_code = :slug
            GROUP BY
                d.province_code, d.slug, d.name, d.name_en, d.full_name, d.area_km2, d.geometry
            """, nativeQuery = true)
    Optional<DestinationProjection> findDestinationWithCentroidBySlug(@Param("slug") String slug);

    @Query(value = """
            SELECT
                d.province_code AS "provinceCode",
                d.slug,
                d.name,
                d.name_en AS "nameEn",
                d.full_name AS "fullName",
                ROUND(d.area_km2::numeric, 2) AS "areaKm2",
                ROUND(ST_Y(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLat",
                ROUND(ST_X(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLon",
                ROUND(ST_X(ST_PointOnSurface(d.geometry))::numeric, 6) AS "centerLng",
                ROUND(ST_YMin(d.geometry)::numeric, 6) AS "bboxMinLat",
                ROUND(ST_XMin(d.geometry)::numeric, 6) AS "bboxMinLon",
                ROUND(ST_YMax(d.geometry)::numeric, 6) AS "bboxMaxLat",
                ROUND(ST_XMax(d.geometry)::numeric, 6) AS "bboxMaxLon",
                COUNT(p.place_id) AS "poiCount",
                COUNT(p.place_id) FILTER (WHERE p.category = 'attraction') AS "attractionCount"
            FROM analytics.destinations_v2 d
            LEFT JOIN analytics.places_v2 p
                ON p.province_code = d.province_code
            WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.name_en) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.full_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.slug) LIKE LOWER(CONCAT('%', :keyword, '%'))
            GROUP BY
                d.province_code, d.slug, d.name, d.name_en, d.full_name, d.area_km2, d.geometry
            ORDER BY "poiCount" DESC, d.province_code ASC
            """, nativeQuery = true)
    List<DestinationProjection> searchDestinationsWithCentroid(@Param("keyword") String keyword);
}
