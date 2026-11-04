package com.travel.planner.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Thuật toán tối ưu thứ tự tham quan:
 *   1. Haversine – tính khoảng cách Trái Đất giữa hai tọa độ (km).
 *   2. Nearest Neighbor – tạo tuyến xuất phát hợp lý.
 *   3. 2-opt – cắt các đoạn chéo nhau bằng cách đảo đoạn con cho tới khi không còn cải thiện.
 */
public final class RouteOptimizer {

    private static final double EARTH_RADIUS_KM = 6_371.0;
    private static final int MAX_2OPT_ITERATIONS = 500;
    private static final double EPSILON = 1e-9;

    private RouteOptimizer() {
    }

    /** Tọa độ dạng số thập phân (vĩ độ, kinh độ). */
    public record Coordinate(double latitude, double longitude) {
    }

    /** Trả về danh sách tọa độ theo thứ tự tuyến đã tối ưu (không thay đổi đầu vào). */
    public static List<Coordinate> optimize(List<Coordinate> input) {
        List<Integer> order = optimizeOrder(input);
        List<Coordinate> tour = new ArrayList<>(order.size());
        for (int index : order) {
            tour.add(input.get(index));
        }
        return tour;
    }

    /** Trả về chỉ mục của các điểm đầu vào theo thứ tự tuyến đã tối ưu. */
    public static List<Integer> optimizeOrder(List<Coordinate> input) {
        if (input == null || input.size() <= 2) {
            int size = input == null ? 0 : input.size();
            List<Integer> order = new ArrayList<>(size);
            for (int i = 0; i < size; i++) {
                order.add(i);
            }
            return order;
        }
        double[][] dist = distanceMatrix(input);
        List<Integer> tour = nearestNeighbor(dist);
        twoOpt(dist, tour);
        return tour;
    }

    /** Khoảng cách đường tròn khép kín (có quay về điểm xuất phát), đơn vị km. */
    public static double totalDistance(List<Coordinate> route) {
        if (route == null || route.size() < 2) {
            return 0.0;
        }
        double sum = 0.0;
        for (int i = 0; i < route.size(); i++) {
            sum += haversine(route.get(i), route.get((i + 1) % route.size()));
        }
        return sum;
    }

    /** Khoảng cách tuyến mở (đi một chiều, không quay về điểm đầu), đơn vị km. */
    public static double totalPathDistance(List<Coordinate> route) {
        if (route == null || route.size() < 2) {
            return 0.0;
        }
        double sum = 0.0;
        for (int i = 0; i < route.size() - 1; i++) {
            sum += haversine(route.get(i), route.get(i + 1));
        }
        return sum;
    }

    /** Công thức Haversine, kết quả tính theo km. */
    public static double haversine(Coordinate a, Coordinate b) {
        double lat1 = Math.toRadians(a.latitude());
        double lat2 = Math.toRadians(b.latitude());
        double dLat = lat2 - lat1;
        double dLon = Math.toRadians(b.longitude() - a.longitude());
        double sinLat = Math.sin(dLat / 2);
        double sinLon = Math.sin(dLon / 2);
        double h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    private static double[][] distanceMatrix(List<Coordinate> coords) {
        int n = coords.size();
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                double d = haversine(coords.get(i), coords.get(j));
                matrix[i][j] = d;
                matrix[j][i] = d;
            }
        }
        return matrix;
    }

    /** Nearest Neighbor bắt đầu từ điểm đầu tiên của danh sách. */
    private static List<Integer> nearestNeighbor(double[][] dist) {
        int n = dist.length;
        List<Integer> tour = new ArrayList<>(n);
        boolean[] visited = new boolean[n];
        int current = 0;
        tour.add(current);
        visited[current] = true;
        for (int step = 1; step < n; step++) {
            int next = -1;
            double best = Double.MAX_VALUE;
            for (int i = 0; i < n; i++) {
                if (!visited[i] && dist[current][i] < best) {
                    best = dist[current][i];
                    next = i;
                }
            }
            visited[next] = true;
            tour.add(next);
            current = next;
        }
        return tour;
    }

    /**
     * 2-opt: chọn hai cạnh (i, i+1) và (k-1, k) rồi đảo đoạn i+1..k-1
     * nếu phép đảo làm tổng quãng đường ngắn hơn.
     */
    private static void twoOpt(double[][] dist, List<Integer> tour) {
        int n = tour.size();
        boolean improved = true;
        int iteration = 0;
        while (improved && iteration < MAX_2OPT_ITERATIONS) {
            improved = false;
            for (int i = 0; i < n - 1 && !improved; i++) {
                for (int k = i + 2; k <= n && !improved; k++) {
                    int a = tour.get(i);
                    int b = tour.get(i + 1);
                    int c = tour.get((k - 1) % n);
                    int d = tour.get(k % n);
                    double gain = dist[a][b] + dist[c][d] - dist[a][c] - dist[b][d];
                    if (gain > EPSILON) {
                        Collections.reverse(tour.subList(i + 1, k));
                        improved = true;
                    }
                }
            }
            iteration++;
        }
    }
}
