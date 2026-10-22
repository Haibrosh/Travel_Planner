package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho dữ liệu trả về của 1 tỉnh/thành phố (Endpoint 1: GET /api/destinations)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationResponse {

    private String provinceCode;
    private String slug;
    private String name;
    private String nameEn;
    private String fullName;
    private Double areaKm2;
    private Double centerLat;
    private Double centerLng;
}

