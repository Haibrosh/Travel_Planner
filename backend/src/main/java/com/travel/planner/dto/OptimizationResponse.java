package com.travel.planner.dto;

import com.travel.planner.model.ItineraryItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response payload for the itinerary optimisation endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationResponse {
    private List<ItineraryItem> orderedItems;
    private double distanceBeforeKm;
    private double distanceAfterKm;
    private double distanceSavedKm;
}
