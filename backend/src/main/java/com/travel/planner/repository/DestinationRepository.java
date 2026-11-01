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
                province_code AS provinceCode,
                slug,
                name,
                name_en AS nameEn,
                full_name AS fullName,
                area_km2 AS areaKm2,
                ROUND(ST_Y(ST_Centroid(geometry))::numeric, 6) AS centerLat,
                ROUND(ST_X(ST_Centroid(geometry))::numeric, 6) AS centerLng
            FROM analytics.destinations_v2
            ORDER BY name ASC
            """, nativeQuery = true)
    List<DestinationProjection> findAllDestinationsWithCentroid();

    @Query(value = """
            SELECT
                province_code AS provinceCode,
                slug,
                name,
                name_en AS nameEn,
                full_name AS fullName,
                area_km2 AS areaKm2,
                ROUND(ST_Y(ST_Centroid(geometry))::numeric, 6) AS centerLat,
                ROUND(ST_X(ST_Centroid(geometry))::numeric, 6) AS centerLng
            FROM analytics.destinations_v2
            WHERE slug = :slug OR province_code = :slug
            """, nativeQuery = true)
    Optional<DestinationProjection> findDestinationWithCentroidBySlug(@Param("slug") String slug);

    @Query(value = """
            SELECT
                province_code AS provinceCode,
                slug,
                name,
                name_en AS nameEn,
                full_name AS fullName,
                area_km2 AS areaKm2,
                ROUND(ST_Y(ST_Centroid(geometry))::numeric, 6) AS centerLat,
                ROUND(ST_X(ST_Centroid(geometry))::numeric, 6) AS centerLng
            FROM analytics.destinations_v2
            WHERE LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(name_en) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(full_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(slug) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY name ASC
            """, nativeQuery = true)
    List<DestinationProjection> searchDestinationsWithCentroid(@Param("keyword") String keyword);
}
