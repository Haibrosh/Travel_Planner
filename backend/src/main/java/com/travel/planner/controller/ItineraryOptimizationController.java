package com.travel.planner.controller;

import com.travel.planner.dto.OptimizationResponse;
import com.travel.planner.model.ItineraryItem;
import com.travel.planner.service.ItineraryItemService;
import com.travel.planner.util.RouteOptimizer;
import com.travel.planner.util.RouteOptimizer.Coordinate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * API to optimise the ordering of itinerary items for a specific day of a trip.
 *
 * POST /api/v1/trips/{tripId}/optimize?dayNumber={day}
 */
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class ItineraryOptimizationController {

    private final ItineraryItemService itineraryItemService;

    @PostMapping("/{tripId}/optimize")
    public ResponseEntity<OptimizationResponse> optimiseDay(
            @PathVariable Long tripId,
            @RequestParam Integer dayNumber) {

        // 1. Load items for the given trip & day, ordered by current positionIndex
        List<ItineraryItem> items = itineraryItemService.getItemsByTripAndDay(tripId, dayNumber);

        // Convert to coordinates (latitude/longitude from Place)
        List<Coordinate> coords = items.stream()
                .map(it -> new Coordinate(it.getPlace().getLatitude(), it.getPlace().getLongitude()))
                .collect(Collectors.toList());

        // 2. Compute distances before optimisation (open‑path)
        double before = RouteOptimizer.totalPathDistance(coords);

        // 3. Optimise order – obtain a list of indices representing the new order
        List<Integer> newOrderIdx = RouteOptimizer.optimizeOrder(coords);

        // Re‑order the ItineraryItem list according to the new indices
        List<ItineraryItem> ordered = newOrderIdx.stream()
                .map(items::get)
                .collect(Collectors.toList());

        // 4. Compute distance after optimisation
        List<Coordinate> orderedCoords = ordered.stream()
                .map(it -> new Coordinate(it.getPlace().getLatitude(), it.getPlace().getLongitude()))
                .collect(Collectors.toList());
        double after = RouteOptimizer.totalPathDistance(orderedCoords);

        // 5. Persist the new ordering (positionIndex = 0,1,2,...)
        itineraryItemService.saveNewOrder(ordered);

        // 6. Build response payload
        OptimizationResponse response = new OptimizationResponse(
                ordered,
                before,
                after,
                before - after
        );
        return ResponseEntity.ok(response);
    }
}
