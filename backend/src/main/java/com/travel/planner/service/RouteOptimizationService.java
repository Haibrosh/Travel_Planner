package com.travel.planner.service;

import com.travel.planner.dto.RouteOptimizationResponse;
import com.travel.planner.model.ItineraryItem;
import com.travel.planner.model.Place;
import com.travel.planner.model.User;
import com.travel.planner.repository.ItineraryItemRepository;
import com.travel.planner.security.TripSecurityService;
import com.travel.planner.util.RouteOptimizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Chức năng: Tối ưu thứ tự các địa điểm của một ngày trong chuyến đi
 * (Haversine + Nearest Neighbor + 2-opt) và tính tổng quãng đường di chuyển.
 */
@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    private final ItineraryItemRepository itineraryItemRepository;
    private final TripSecurityService tripSecurityService;

    // Sắp xếp lại position_index cho các địa điểm của một ngày và trả về tổng quãng đường (km)
    @Transactional
    public RouteOptimizationResponse optimizeDayRoute(Long tripId, Integer dayNumber, User currentUser) {
        tripSecurityService.getTripIfOwner(tripId, currentUser);

        List<ItineraryItem> dayItems = itineraryItemRepository
                .findByTripTripIdOrderByDayNumberAscPositionIndexAsc(tripId)
                .stream()
                .filter(item -> dayNumber.equals(item.getDayNumber()))
                .toList();

        List<RouteOptimizer.Coordinate> points = dayItems.stream()
                .map(RouteOptimizationService::toCoordinate)
                .toList();

        List<Integer> bestOrder = RouteOptimizer.optimizeOrder(points);
        List<ItineraryItem> reordered = new ArrayList<>(bestOrder.size());
        for (int itemIndex : bestOrder) {
            ItineraryItem item = dayItems.get(itemIndex);
            item.setPositionIndex((double) (reordered.size() + 1));
            reordered.add(item);
        }
        itineraryItemRepository.saveAll(reordered);

        return buildResponse(tripId, dayNumber, reordered);
    }

    private RouteOptimizationResponse buildResponse(Long tripId, Integer dayNumber, List<ItineraryItem> orderedItems) {
        List<RouteOptimizer.Coordinate> points = orderedItems.stream()
                .map(RouteOptimizationService::toCoordinate)
                .toList();

        // Tuyến mở: đi từ địa điểm đầu tiên đến địa điểm cuối cùng của ngày, không quay về điểm xuất phát.
        double totalKm = Math.round(RouteOptimizer.totalPathDistance(points) * 100.0) / 100.0;

        List<RouteOptimizationResponse.OptimizedStop> stops = orderedItems.stream()
                .map(item -> RouteOptimizationResponse.OptimizedStop.builder()
                        .itemId(item.getItemId())
                        .placeId(item.getPlace().getPlaceId())
                        .placeName(item.getPlace().getName())
                        .latitude(item.getPlace().getLatitude())
                        .longitude(item.getPlace().getLongitude())
                        .positionIndex(item.getPositionIndex())
                        .build())
                .toList();

        return RouteOptimizationResponse.builder()
                .tripId(tripId)
                .dayNumber(dayNumber)
                .totalDistanceKm(totalKm)
                .stops(stops)
                .build();
    }

    private static RouteOptimizer.Coordinate toCoordinate(ItineraryItem item) {
        Place place = item.getPlace();
        return new RouteOptimizer.Coordinate(place.getLatitude(), place.getLongitude());
    }
}
