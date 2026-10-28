package com.travel.planner.util;

import static org.assertj.core.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class RouteOptimizerTest {

    @Test
    void shouldReorderUnsortedCoordinates() {
        // 10 mixed coordinates (unsorted)
        List<RouteOptimizer.Coordinate> unsorted = List.of(
                new RouteOptimizer.Coordinate(10.762622, 106.660172), // Ho Chi Minh
                new RouteOptimizer.Coordinate(21.027764, 105.834160), // Hà Nội
                new RouteOptimizer.Coordinate(16.054407, 108.202167), // Đà Nẵng
                new RouteOptimizer.Coordinate(20.983766, 106.699066), // Hải Phòng
                new RouteOptimizer.Coordinate(10.041637, 105.780757), // Cần Thơ
                new RouteOptimizer.Coordinate(12.238791, 109.196747), // Nha Trang
                new RouteOptimizer.Coordinate(13.756331, 100.501765), // Bangkok (outside VN)
                new RouteOptimizer.Coordinate(22.300000, 114.166667), // Hong Kong
                new RouteOptimizer.Coordinate(23.129110, 113.264381), // Guangzhou
                new RouteOptimizer.Coordinate(27.717245, 85.324960)   // Kathmandu
        );

        // Run optimizer
        List<RouteOptimizer.Coordinate> result = RouteOptimizer.optimize(unsorted);

        // Same elements, possibly reordered
        assertThat(result).hasSameSizeAs(unsorted);
        assertThat(result).containsExactlyInAnyOrderElementsOf(unsorted);

        // Optimized distance must not be larger than original order distance
        double originalDist = totalDistance(unsorted);
        double optimizedDist = totalDistance(result);
        assertThat(optimizedDist).isLessThanOrEqualTo(originalDist);
    }

    /** Helper: sum Haversine distances of a closed tour (last → first). */
    private double totalDistance(List<RouteOptimizer.Coordinate> points) {
        double sum = 0.0;
        for (int i = 0; i < points.size(); i++) {
            RouteOptimizer.Coordinate a = points.get(i);
            RouteOptimizer.Coordinate b = points.get((i + 1) % points.size());
            sum += RouteOptimizer.haversine(a, b);
        }
        return sum;
    }
}
