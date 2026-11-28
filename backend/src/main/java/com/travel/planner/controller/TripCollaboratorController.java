package com.travel.planner.controller;

import com.travel.planner.dto.CollaboratorResponse;
import com.travel.planner.dto.InviteLinkRequest;
import com.travel.planner.dto.InviteLinkResponse;
import com.travel.planner.dto.JoinTripRequest;
import com.travel.planner.dto.JoinTripResponse;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.service.TripCollaboratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Chức năng: Cung cấp các REST API quản lý thành viên & lời mời cộng tác chuyến đi
 * tại '/api/v1/trips'.
 */
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
@Tag(name = "Trip Collaborators", description = "Quản lý lời mời JWT và thành viên cộng tác chuyến đi (app.trip_members)")
public class TripCollaboratorController {

    private final TripCollaboratorService tripCollaboratorService;

    @PostMapping("/{tripId}/invite-link")
    @Operation(summary = "Tạo link mời cộng tác chứa JWT có hiệu lực 7 ngày (chỉ OWNER)")
    public ResponseEntity<InviteLinkResponse> createInviteLink(
            @PathVariable("tripId") Long tripId,
            @RequestBody(required = false) InviteLinkRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        String role = request != null ? request.getRole() : null;
        return ResponseEntity.ok(
                tripCollaboratorService.createInviteLink(tripId, role, currentUser.getUser())
        );
    }

    @PostMapping("/join")
    @Operation(summary = "Xác thực JWT lời mời và thêm user hiện tại vào bảng app.trip_members")
    public ResponseEntity<JoinTripResponse> joinTrip(
            @RequestParam(value = "token", required = false) String token,
            @RequestBody(required = false) JoinTripRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        String resolvedToken = (token != null && !token.isBlank())
                ? token
                : (request != null ? request.getToken() : null);
        return ResponseEntity.ok(
                tripCollaboratorService.joinTripByToken(resolvedToken, currentUser.getUser())
        );
    }

    @GetMapping("/{tripId}/collaborators")
    @Operation(summary = "Lấy danh sách thành viên (OWNER & COLLABORATOR đang ACTIVE) của chuyến đi")
    public ResponseEntity<List<CollaboratorResponse>> getCollaborators(
            @PathVariable("tripId") Long tripId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(
                tripCollaboratorService.getCollaborators(tripId, currentUser.getUser())
        );
    }

    @DeleteMapping("/{tripId}/collaborators/{userId}")
    @Operation(summary = "Xóa cộng tác viên khỏi chuyến đi (OWNER xóa thành viên, hoặc COLLABORATOR tự rời nhóm)")
    public ResponseEntity<Map<String, String>> removeCollaborator(
            @PathVariable("tripId") Long tripId,
            @PathVariable("userId") Long userId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        tripCollaboratorService.removeCollaborator(tripId, userId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("message", "Xóa thành viên khỏi chuyến đi thành công."));
    }
}
