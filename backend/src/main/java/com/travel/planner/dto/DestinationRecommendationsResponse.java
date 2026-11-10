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
public class DestinationRecommendationsResponse {
    private DestinationSummaryResponse destination;
    private String category;
    private Integer limit;
    private Integer offset;
    private List<PlaceDetailResponse> items;
}
