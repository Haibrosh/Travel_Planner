package com.travel.planner.controller;

import com.travel.planner.dto.ChecklistItemRequest;
import com.travel.planner.dto.ChecklistItemResponse;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.service.ChecklistService;
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

/**
 * Chức năng: Cung cấp các REST API quản lý hành lý (Checklist) cho chuyến đi tại '/api/v1/trips/{tripId}/checklists'.
 */
@RestController
@RequestMapping("/api/v1/trips/{tripId}/checklists")
@RequiredArgsConstructor
@Tag(name = "Checklists", description = "Quản lý danh sách hành lý cần chuẩn bị của chuyến đi")
public class ChecklistController {

    private final ChecklistService checklistService;

    @GetMapping
    @Operation(summary = "Lấy danh sách hành lý của chuyến đi")
    public ResponseEntity<List<ChecklistItemResponse>> getChecklistItems(
            @PathVariable("tripId") Long tripId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(checklistService.getChecklistItems(tripId, currentUser.getUser()));
    }

    @PostMapping
    @Operation(summary = "Thêm mới một món đồ vào danh sách hành lý")
    public ResponseEntity<ChecklistItemResponse> createChecklistItem(
            @PathVariable("tripId") Long tripId,
            @Valid @RequestBody ChecklistItemRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ChecklistItemResponse created = checklistService.createChecklistItem(tripId, request, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{itemId}")
    @Operation(summary = "Cập nhật thông tin một món đồ hành lý")
    public ResponseEntity<ChecklistItemResponse> updateChecklistItem(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @Valid @RequestBody ChecklistItemRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ChecklistItemResponse updated = checklistService.updateChecklistItem(
                tripId, itemId, request, currentUser.getUser());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping({"/{itemId}/toggle", "/{itemId}"})
    @Operation(summary = "Đảo trạng thái đã chuẩn bị (isCompleted) của một món đồ hành lý")
    public ResponseEntity<ChecklistItemResponse> toggleChecklistItem(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ChecklistItemResponse updated = checklistService.toggleChecklistItem(tripId, itemId, currentUser.getUser());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{itemId}")
    @Operation(summary = "Xóa một món đồ khỏi danh sách hành lý")
    public ResponseEntity<Map<String, String>> deleteChecklistItem(
            @PathVariable("tripId") Long tripId,
            @PathVariable("itemId") Long itemId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        checklistService.deleteChecklistItem(tripId, itemId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("message", "Xóa mục hành lý thành công."));
    }
}
