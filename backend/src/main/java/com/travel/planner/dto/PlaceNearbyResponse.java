package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceNearbyResponse {
    private MapCenterResponse center;
    private Integer radiusMeters;
    private String category;
    private List<PlaceDetailResponse> items;
}
