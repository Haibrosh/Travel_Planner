package com.travel.planner.controller;

import com.travel.planner.dto.OptimizationResponse;
import com.travel.planner.model.ItineraryItem;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.TripSecurityService;
import com.travel.planner.service.ItineraryItemService;
import com.travel.planner.util.RouteOptimizer;
import com.travel.planner.util.RouteOptimizer.Coordinate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
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
@Tag(name = "Itinerary Optimization", description = "Tối ưu lộ trình di chuyển trong ngày (2-opt)")
public class ItineraryOptimizationController {

    private final ItineraryItemService itineraryItemService;
    private final TripSecurityService tripSecurityService;

    @PostMapping("/{tripId}/optimize")
    @Transactional
    @Operation(summary = "Tối ưu thứ tự các địa điểm trong một ngày của chuyến đi")
    public ResponseEntity<OptimizationResponse> optimiseDay(
            @PathVariable("tripId") Long tripId,
            @RequestParam("dayNumber") Integer dayNumber,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser != null && currentUser.getUser() != null) {
            tripSecurityService.getTripIfOwner(tripId, currentUser.getUser());
        }

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

        // 5. Persist the new ordering (positionIndex = 1.0, 2.0, 3.0,...)
        itineraryItemService.saveNewOrder(ordered);

        // 6. Build response payload using DTOs to avoid lazy proxy serialization issues
        OptimizationResponse response = OptimizationResponse.fromEntities(ordered, before, after);
        return ResponseEntity.ok(response);
    }
}
