package com.travel.planner.dto;

import com.travel.planner.model.ItineraryItem;
import com.travel.planner.model.Place;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OptimizationResponseTest {

    @Test
    void keepsRouteCoordinatesInOptimizedItemOrder() {
        ItineraryItem firstStop = ItineraryItem.builder()
                .itemId(2L)
                .place(Place.builder().placeId(20L).latitude(10.8231).longitude(106.6297).build())
                .build();
        ItineraryItem secondStop = ItineraryItem.builder()
                .itemId(1L)
                .place(Place.builder().placeId(10L).latitude(16.0544).longitude(108.2022).build())
                .build();

        OptimizationResponse response = OptimizationResponse.fromEntities(
                List.of(firstStop, secondStop), 100.0, 80.0);

        assertThat(response.getRouteCoordinates())
                .extracting(OptimizationResponse.RouteCoordinate::getLatitude,
                        OptimizationResponse.RouteCoordinate::getLongitude)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(10.8231, 106.6297),
                        org.assertj.core.groups.Tuple.tuple(16.0544, 108.2022));
    }
}
