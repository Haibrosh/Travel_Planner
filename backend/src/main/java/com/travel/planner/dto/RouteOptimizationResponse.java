package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO kết quả tối ưu thứ tự di chuyển cho một ngày trong chuyến đi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptimizationResponse {

    private Long tripId;
    private Integer dayNumber;
    private Double totalDistanceKm;
    private List<OptimizedStop> stops;

    /** Một địa điểm sau khi đã xếp lại thứ tự. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptimizedStop {
        private Long itemId;
        private Long placeId;
        private String placeName;
        private Double latitude;
        private Double longitude;
        private Double positionIndex;
    }
}
