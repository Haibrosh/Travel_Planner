package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BBoxResponse {
    private Double minLat;
    private Double minLon;
    private Double maxLat;
    private Double maxLon;
}
