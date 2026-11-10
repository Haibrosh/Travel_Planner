package com.travel.planner.dto;

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
}
