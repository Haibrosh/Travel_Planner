package com.travel.planner.repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Interface-based Projection hứng dữ liệu Native Query từ các bảng analytics:
 * places_v2, destinations_v2, place_rankings, place_contents.
 */
public interface PlaceProjection {

    Long getPlaceId();
    String getSource();
    String getSourceId();
    String getName();
    String getCategory();
    String getSubcategory();
    String getAddress();
    String getPhone();
    String getWebsite();
    String getOpeningHours();
    Double getLatitude();
    Double getLongitude();
    String getProvinceCode();
    String getProvinceName();
    String getProvinceSlug();
    BigDecimal getRating();
    Integer getReviewCount();
    String getPhotoUrl();

    // Điểm xếp hạng từ place_rankings
    Double getRankingScore();
    Double getSubcatPart();
    Double getWikiPart();
    Double getRatingPart();
    Double getReviewPart();
    String getFormulaVersion();

    // Thông tin nội dung từ place_contents
    Boolean getHasContent();
    String getContentLanguage();
    String getContentSource();
    String getWikidataId();
    String getSourceTitle();
    String getSourceWikiUrl();
    Long getRevisionId();
    String getContentSummary();
    String getContentDescriptionMd();
    String getContentLicense();
    String getContentAttribution();
    OffsetDateTime getContentUpdatedAt();

    // Trường bổ sung cho search & nearby
    Double getTextSimilarity();
    Double getCombinedSearchScore();
    Double getDistanceMeters();
}
