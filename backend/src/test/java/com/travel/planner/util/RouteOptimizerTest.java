package com.travel.planner.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;

import com.travel.planner.util.RouteOptimizer.Coordinate;

class RouteOptimizerTest {

    private static final long MAX_MILLIS = 2_000;

    @Test
    void shouldReorderTenUnsortedCoordinates() {
        List<Coordinate> unsorted = List.of(
                new Coordinate(10.762622, 106.660172), // TP.HCM
                new Coordinate(21.027764, 105.834160), // Hà Nội
                new Coordinate(16.054407, 108.202167), // Đà Nẵng
                new Coordinate(20.983766, 106.699066), // Hải Phòng
                new Coordinate(10.041637, 105.780757), // Cần Thơ
                new Coordinate(12.238791, 109.196747), // Nha Trang
                new Coordinate(13.756331, 100.501765), // Bangkok
                new Coordinate(22.300000, 114.166667), // Hồng Kông
                new Coordinate(23.129110, 113.264381), // Quảng Châu
                new Coordinate(27.717245, 85.324960)   // Kathmandu
        );

        List<Coordinate> tour = RouteOptimizer.optimize(unsorted);

        assertThat(tour).hasSameSizeAs(unsorted);
        assertThat(tour).containsExactlyInAnyOrderElementsOf(unsorted);
        assertThat(RouteOptimizer.totalDistance(tour))
                .isLessThan(RouteOptimizer.totalDistance(unsorted));
    }

    @Test
    void shouldOptimizeFifteenPlacesUnderTwoSeconds() {
        List<Coordinate> fifteenPlaces = fifteenUnsortedPlaces();

        long start = System.nanoTime();
        List<Coordinate> tour = RouteOptimizer.optimize(fifteenPlaces);
        long elapsedMillis = (System.nanoTime() - start) / 1_000_000;

        assertThat(elapsedMillis).isLessThan(MAX_MILLIS);
        assertThat(tour).hasSize(15);
        assertThat(tour).containsExactlyInAnyOrderElementsOf(fifteenPlaces);
        assertThat(RouteOptimizer.totalDistance(tour))
                .isLessThan(RouteOptimizer.totalDistance(fifteenPlaces));
    }

    @Test
    void shouldShortenRouteInAtLeast80PercentOfFifteenPointCases() {
        int totalCases = 10;
        int improvedCases = 0;

        for (int seed = 0; seed < totalCases; seed++) {
            List<Coordinate> shuffled = randomPlaces(new Random(seed), 15);

            long start = System.nanoTime();
            List<Coordinate> tour = RouteOptimizer.optimize(shuffled);
            long elapsedMillis = (System.nanoTime() - start) / 1_000_000;

            double beforeKm = RouteOptimizer.totalDistance(shuffled);
            double afterKm = RouteOptimizer.totalDistance(tour);

            assertThat(elapsedMillis).isLessThan(MAX_MILLIS);
            assertThat(tour).hasSameSizeAs(shuffled);
            assertThat(afterKm).isLessThanOrEqualTo(beforeKm);

            if (afterKm < beforeKm) {
                improvedCases++;
            }
        }

        assertThat(improvedCases).isGreaterThanOrEqualTo(8);
    }

    /** 15 địa điểm du lịch Việt Nam xáo trộn Bắc – Trung – Nam. */
    private static List<Coordinate> fifteenUnsortedPlaces() {
        return List.of(
                new Coordinate(12.238791, 109.196747), // Nha Trang
                new Coordinate(21.027764, 105.834160), // Hà Nội
                new Coordinate(10.823098, 106.629665), // TP.HCM
                new Coordinate(16.054407, 108.202167), // Đà Nẵng
                new Coordinate(20.946714, 107.073025), // Hạ Long
                new Coordinate(11.940413, 108.458293), // Đà Lạt
                new Coordinate(16.461903, 107.595484), // Huế
                new Coordinate(10.045212, 105.746857), // Cần Thơ
                new Coordinate(20.254315, 105.975267), // Ninh Bình
                new Coordinate(10.289900, 103.975200), // Phú Quốc
                new Coordinate(18.679577, 105.681310), // Vinh
                new Coordinate(10.346047, 107.084280), // Vũng Tàu
                new Coordinate(15.880100, 108.338000), // Hội An
                new Coordinate(19.806010, 105.773000), // Thanh Hóa
                new Coordinate(17.453000, 106.600000)  // Đồng Hới
        );
    }

    private static List<Coordinate> randomPlaces(Random random, int count) {
        List<Coordinate> points = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            double latitude = 8.5 + random.nextDouble() * 12.5;   // 8.5 – 21.0
            double longitude = 102.5 + random.nextDouble() * 6.5;  // 102.5 – 109.0
            points.add(new Coordinate(latitude, longitude));
        }
        return points;
    }
}
