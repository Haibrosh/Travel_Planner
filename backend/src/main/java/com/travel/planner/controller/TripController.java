package com.travel.planner.controller;

import com.travel.planner.dto.TripRequest;
import com.travel.planner.dto.TripResponse;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Chức năng: Cung cấp các REST API quản lý chuyến đi (Tạo, Xem, Cập nhật, Xóa) tại '/api/v1/trips'.
 */
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    // API Tạo chuyến đi mới (POST /api/v1/trips)
    @PostMapping
    public ResponseEntity<TripResponse> createTrip(
            @Valid @RequestBody TripRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        TripResponse created = tripService.createTrip(request, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // API Lấy danh sách chuyến đi của user đang đăng nhập (GET /api/v1/trips)
    @GetMapping
    public ResponseEntity<List<TripResponse>> getMyTrips(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(tripService.getMyTrips(currentUser.getUser()));
    }

    // API Xem chi tiết một chuyến đi theo ID - chỉ chủ sở hữu mới xem được (GET /api/v1/trips/{id})
    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(tripService.getTripById(id, currentUser.getUser()));
    }

    // API Cập nhật chuyến đi (tên, mô tả, điểm đến, ngày) - chỉ chủ sở hữu mới sửa được (PUT /api/v1/trips/{id})
    @PutMapping("/{id}")
    public ResponseEntity<TripResponse> updateTrip(
            @PathVariable("id") Long id,
            @Valid @RequestBody TripRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(tripService.updateTrip(id, request, currentUser.getUser()));
    }

    // API Xóa một chuyến đi theo ID - chỉ chủ sở hữu mới xóa được (DELETE /api/v1/trips/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTrip(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        tripService.deleteTrip(id, currentUser.getUser());
        return ResponseEntity.ok(Map.of("message", "Xóa chuyến đi thành công."));
    }
}
