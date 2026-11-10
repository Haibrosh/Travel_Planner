package com.travel.planner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travel.planner.model.Place;
import com.travel.planner.repository.PlaceProjection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlaceDetailResponse {

    private Long id;
    private Long placeId;
    private String source;
    private String sourceId;
    private String name;
    private String category;
    private String subcategory;
    private String address;
    private String phone;
    private String website;
    private String openingHours;
    private Double latitude;
    private Double longitude;
    private String provinceCode;
    private DestinationSummaryResponse destination;
    private BigDecimal rating;
    private Integer reviewCount;
    private String photoUrl;

    // Trường ranking & nội dung tóm tắt
    private Double rankingScore;
    private Boolean hasContent;
    private String contentLanguage;

    // Chi tiết ranking (cho API GET /places/{id})
    private PlaceRankingResponse ranking;

    // Chi tiết bài viết Wikipedia/Wikidata (cho API GET /places/{id})
    private PlaceContentResponse content;

    // Trường bổ sung cho search & nearby
    private Double textSimilarity;
    private Double combinedSearchScore;
    private Double distanceMeters;

    public static PlaceDetailResponse fromEntity(Place place) {
        if (place == null) {
            return null;
        }
        DestinationSummaryResponse dest = null;
        String provinceCode = null;
        if (place.getDestination() != null) {
            provinceCode = place.getDestination().getProvinceCode();
            dest = DestinationSummaryResponse.builder()
                    .provinceCode(place.getDestination().getProvinceCode())
                    .slug(place.getDestination().getSlug())
                    .name(place.getDestination().getName())
                    .build();
        }

        return PlaceDetailResponse.builder()
                .id(place.getPlaceId())
                .placeId(place.getPlaceId())
                .source(place.getSource())
                .sourceId(place.getSourceId())
                .name(place.getName())
                .category(place.getCategory())
                .subcategory(place.getSubcategory())
                .address(place.getAddress())
                .phone(place.getPhone())
                .website(place.getWebsite())
                .openingHours(place.getOpeningHours())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .provinceCode(provinceCode)
                .destination(dest)
                .rating(place.getRating())
                .reviewCount(place.getReviewCount())
                .photoUrl(place.getPhotoUrl())
                .build();
    }

    public static PlaceDetailResponse fromProjection(PlaceProjection p) {
        if (p == null) {
            return null;
        }

        DestinationSummaryResponse dest = null;
        if (p.getProvinceCode() != null) {
            dest = DestinationSummaryResponse.builder()
                    .provinceCode(p.getProvinceCode())
                    .slug(p.getProvinceSlug())
                    .name(p.getProvinceName())
                    .build();
        }

        PlaceRankingResponse ranking = null;
        if (p.getRankingScore() != null) {
            ranking = PlaceRankingResponse.builder()
                    .rankingScore(p.getRankingScore())
                    .subcatPart(p.getSubcatPart())
                    .wikiPart(p.getWikiPart())
                    .ratingPart(p.getRatingPart())
                    .reviewPart(p.getReviewPart())
                    .formulaVersion(p.getFormulaVersion())
                    .build();
        }

        PlaceContentResponse content = null;
        if (Boolean.TRUE.equals(p.getHasContent()) || p.getContentSummary() != null) {
            content = PlaceContentResponse.builder()
                    .language(p.getContentLanguage())
                    .contentSource(p.getContentSource())
                    .wikidataId(p.getWikidataId())
                    .sourceTitle(p.getSourceTitle())
                    .sourceWikiUrl(p.getSourceWikiUrl())
                    .revisionId(p.getRevisionId())
                    .summary(p.getContentSummary())
                    .descriptionMd(p.getContentDescriptionMd())
                    .license(p.getContentLicense())
                    .attribution(p.getContentAttribution())
                    .build();
        }

        return PlaceDetailResponse.builder()
                .id(p.getPlaceId())
                .placeId(p.getPlaceId())
                .source(p.getSource())
                .sourceId(p.getSourceId())
                .name(p.getName())
                .category(p.getCategory())
                .subcategory(p.getSubcategory())
                .address(p.getAddress())
                .phone(p.getPhone())
                .website(p.getWebsite())
                .openingHours(p.getOpeningHours())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .provinceCode(p.getProvinceCode())
                .destination(dest)
                .rating(p.getRating())
                .reviewCount(p.getReviewCount())
                .photoUrl(p.getPhotoUrl())
                .rankingScore(p.getRankingScore())
                .hasContent(p.getHasContent() != null ? p.getHasContent() : (content != null))
                .contentLanguage(p.getContentLanguage())
                .ranking(ranking)
                .content(content)
                .textSimilarity(p.getTextSimilarity())
                .combinedSearchScore(p.getCombinedSearchScore())
                .distanceMeters(p.getDistanceMeters())
                .build();
    }
}
