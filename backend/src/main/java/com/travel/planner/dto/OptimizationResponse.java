package com.travel.planner.dto;

import com.travel.planner.model.ItineraryItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

/**
 * Response payload for the itinerary optimisation endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationResponse {
    private List<ItineraryItemResponse> orderedItems;
    private double distanceBeforeKm;
    private double distanceAfterKm;
    private double distanceSavedKm;

    public static OptimizationResponse fromEntities(
            List<ItineraryItem> entities,
            double distanceBeforeKm,
            double distanceAfterKm
    ) {
        List<ItineraryItemResponse> dtoList = entities == null
                ? Collections.emptyList()
                : entities.stream()
                        .map(ItineraryItemResponse::fromEntity)
                        .toList();
        double beforeRounded = Math.round(distanceBeforeKm * 100.0) / 100.0;
        double afterRounded = Math.round(distanceAfterKm * 100.0) / 100.0;
        double savedRounded = Math.max(0.0, Math.round((distanceBeforeKm - distanceAfterKm) * 100.0) / 100.0);

        return OptimizationResponse.builder()
                .orderedItems(dtoList)
                .distanceBeforeKm(beforeRounded)
                .distanceAfterKm(afterRounded)
                .distanceSavedKm(savedRounded)
                .build();
    }
}
