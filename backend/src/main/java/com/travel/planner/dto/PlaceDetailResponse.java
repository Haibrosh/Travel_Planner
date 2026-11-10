package com.travel.planner.dto;

import com.travel.planner.model.Place;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDetailResponse {

    private Long id;
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
    private BigDecimal rating;
    private Integer reviewCount;
    private String photoUrl;

    public static PlaceDetailResponse fromEntity(Place place) {
        if (place == null) {
            return null;
        }
        return PlaceDetailResponse.builder()
                .id(place.getPlaceId())
                .name(place.getName())
                .category(place.getCategory())
                .subcategory(place.getSubcategory())
                .address(place.getAddress())
                .phone(place.getPhone())
                .website(place.getWebsite())
                .openingHours(place.getOpeningHours())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .provinceCode(place.getDestination() != null ? place.getDestination().getProvinceCode() : null)
                .rating(place.getRating())
                .reviewCount(place.getReviewCount())
                .photoUrl(place.getPhotoUrl())
                .build();
    }
}
