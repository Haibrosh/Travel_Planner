package com.travel.planner.repository;

/**
 * Projection interface hứng kết quả từ native query ST_PointOnSurface trong PostgreSQL PostGIS.
 */
public interface DestinationProjection {

    String getProvinceCode();

    String getSlug();

    String getName();

    String getNameEn();

    String getFullName();

    Double getAreaKm2();

    Double getCenterLat();

    Double getCenterLon();

    default Double getCenterLng() {
        return getCenterLon();
    }

    Double getBboxMinLat();

    Double getBboxMinLon();

    Double getBboxMaxLat();

    Double getBboxMaxLon();

    Long getPoiCount();

    Long getAttractionCount();
}

