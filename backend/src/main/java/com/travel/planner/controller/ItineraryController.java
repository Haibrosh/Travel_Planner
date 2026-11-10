package com.travel.planner.controller;

import com.travel.planner.dto.CreateItineraryItemRequest;
import com.travel.planner.dto.ItineraryItemResponse;
import com.travel.planner.dto.ReorderItineraryItemRequest;
import com.travel.planner.dto.UpdateItineraryItemRequest;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.service.ItineraryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/trips/{tripId}/itinerary")
@RequiredArgsConstructor
@Tag(name = "Itinerary", description = "Quản lý lịch trình chi tiết chuyến đi (Itinerary Items)")
public class ItineraryController {

    private final ItineraryService itineraryService;

    // API Lấy danh sách địa điểm theo dayNumber và orderIndex (GET /api/v1/trips/{tripId}/itinerary)
    @GetMapping
    @Operation(summary = "Lấy danh sách địa điểm trong lịch trình theo thứ tự ngày và vị trí")
    public ResponseEntity<List<ItineraryItemResponse>> getItinerary(
            @PathVariable("tripId") Long tripId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        List<ItineraryItemResponse> items = itineraryService.getItinerary(tripId, currentUser.getUser());
        return ResponseEntity.ok(items);
    }

    // API Thêm địa điểm vào ngày, tự động gán orderIndex ở cuối danh sách (POST /api/v1/trips/{tripId}/itinerary/items)
    @PostMapping("/items")
    @Operation(summary = "Thêm địa điểm vào ngày trong lịch trình (tự động gán vị trí ở cuối ngày)")
    public ResponseEntity<ItineraryItemResponse> addItem(
            @PathVariable("tripId") Long tripId,
            @Valid @RequestBody CreateItineraryItemRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        ItineraryItemResponse created = itineraryService.addItineraryItem(tripId, request, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // API Cập nhật thông tin thời gian của địa điểm (PUT /api/v1/trips/{tripId}/itinerary/items/{itemId})
    @PutMapping("/items/{itemId}")
    @Operation(summary = "Cập nhật thời gian bắt đầu và kết thúc của một địa điểm trong lịch trình")
    public ResponseEntity<ItineraryItemResponse> updateItem(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @Valid @RequestBody UpdateItineraryItemRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        ItineraryItemResponse updated = itineraryService.updateItineraryItem(tripId, itemId, request, currentUser.getUser());
        return ResponseEntity.ok(updated);
    }

    // API Xóa cứng địa điểm khỏi ngày trong lịch trình (DELETE /api/v1/trips/{tripId}/itinerary/items/{itemId})
    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Xóa cứng một địa điểm khỏi lịch trình")
    public ResponseEntity<Map<String, String>> deleteItem(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        itineraryService.deleteItineraryItem(tripId, itemId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("message", "Xóa địa điểm khỏi lịch trình thành công."));
    }

    // API Kéo thả đổi thứ tự địa điểm (PATCH /api/v1/trips/{tripId}/itinerary/items/{itemId}/reorder)
    @PatchMapping("/items/{itemId}/reorder")
    @Operation(summary = "Thay đổi thứ tự địa điểm khi kéo thả (chia đôi orderIndex, tự rebalance khi đạt giới hạn)")
    public ResponseEntity<ItineraryItemResponse> reorderItem(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @RequestBody ReorderItineraryItemRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        ItineraryItemResponse updated = itineraryService.reorderItineraryItem(tripId, itemId, request, currentUser.getUser());
        return ResponseEntity.ok(updated);
    }

    // Hỗ trợ thêm phương thức PUT cho /reorder để tương thích tối đa với Client
    @PutMapping("/items/{itemId}/reorder")
    @Operation(summary = "Thay đổi thứ tự địa điểm khi kéo thả (chia đôi orderIndex, tự rebalance khi đạt giới hạn)")
    public ResponseEntity<ItineraryItemResponse> reorderItemPut(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @RequestBody ReorderItineraryItemRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        ItineraryItemResponse updated = itineraryService.reorderItineraryItem(tripId, itemId, request, currentUser.getUser());
        return ResponseEntity.ok(updated);
    }
}
