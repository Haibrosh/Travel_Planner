package com.travel.planner.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Utility class that provides a very simple travelling‑salesman solver.
 * The algorithm consists of three stages:
 *   1. Compute pairwise Haversine distances.
 *   2. Build an initial tour using the Nearest‑Neighbor heuristic.
 *   3. Improve the tour with a 2‑opt local‑search until no improvement
 *      or a safe iteration limit is reached.
 */
public class RouteOptimizer {

    private static final double EARTH_RADIUS_KM = 6_371.0;
    private static final int MAX_2OPT_ITER = 500;

    /** Simple immutable coordinate (latitude, longitude in decimal degrees). */
    public static final class Coordinate {
        public final double latitude;
        public final double longitude;
        public Coordinate(double latitude, double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
        @Override public boolean equals(Object o) {return o instanceof Coordinate c && Double.compare(c.latitude, latitude)==0 && Double.compare(c.longitude, longitude)==0;}
        @Override public int hashCode() {return Objects.hash(latitude, longitude);}        
        @Override public String toString() {return "("+latitude+","+longitude+")";}
    }

    /**
     * Returns a new list representing an optimized tour of the supplied coordinates.
     * The original list is not mutated.
     */
    public static List<Coordinate> optimize(List<Coordinate> input) {
        if (input == null || input.size() <= 1) {
            return input == null ? Collections.emptyList() : new ArrayList<>(input);
        }
        // 1. Build distance matrix
        double[][] dist = distanceMatrix(input);
        // 2. Initial tour via nearest‑neighbor (start from first point)
        List<Integer> tourIdx = nearestNeighbor(dist);
        // 3. 2‑opt improvement
        twoOpt(dist, tourIdx);
        // Convert index tour back to coordinates
        List<Coordinate> result = new ArrayList<>(tourIdx.size());
        for (int idx : tourIdx) {
            result.add(input.get(idx));
        }
        return result;
    }

    private static double[][] distanceMatrix(List<Coordinate> coords) {
        int n = coords.size();
        double[][] mat = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                double d = haversine(coords.get(i), coords.get(j));
                mat[i][j] = d;
                mat[j][i] = d;
            }
        }
        return mat;
    }

    static double haversine(Coordinate a, Coordinate b) {
        double lat1 = Math.toRadians(a.latitude);
        double lat2 = Math.toRadians(b.latitude);
        double dLat = lat2 - lat1;
        double dLon = Math.toRadians(b.longitude - a.longitude);
        double sinLat = Math.sin(dLat / 2);
        double sinLon = Math.sin(dLon / 2);
        double h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    /** Nearest‑neighbor starting from the first vertex (index 0). */
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
            if (next == -1) break; // should not happen
            visited[next] = true;
            tour.add(next);
            current = next;
        }
        return tour;
    }

    /** 2‑opt local search that mutates the index list in‑place. */
    private static void twoOpt(double[][] dist, List<Integer> tour) {
        int n = tour.size();
        boolean improved = true;
        int iter = 0;
        while (improved && iter < MAX_2OPT_ITER) {
            improved = false;
            for (int i = 0; i < n - 1; i++) {
                for (int k = i + 2; k <= n; k++) {
                    double delta =
                        - dist[tour.get(i)][tour.get(i + 1)]
                        - dist[tour.get((k - 1) % n)][tour.get(k % n)]
                        + dist[tour.get(i)][tour.get((k - 1) % n)]
                        + dist[tour.get(i + 1)][tour.get(k % n)];
                    if (delta < -1e-9) {
                        if (k == n) {
                            Collections.reverse(tour.subList(i + 1, n));
                        } else {
                            Collections.reverse(tour.subList(i + 1, k));
                        }
                        improved = true;
                    }
                }
            }
            iter++;
        }
    }
}
