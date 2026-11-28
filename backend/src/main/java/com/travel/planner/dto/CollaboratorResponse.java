package com.travel.planner.dto;

import com.travel.planner.model.Trip;
import com.travel.planner.model.TripMember;
import com.travel.planner.model.User;
import com.travel.planner.security.TripSecurityService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin thành viên (OWNER hoặc COLLABORATOR) đang hoạt động của chuyến đi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollaboratorResponse {

    private Long tripId;
    private Long userId;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    private String status;
    private Boolean isOwner;
    private LocalDateTime joinedAt;

    public static CollaboratorResponse fromEntity(TripMember member) {
        User user = member.getUser();
        Long tripId = member.getTrip() != null
                ? member.getTrip().getTripId()
                : (member.getId() != null ? member.getId().getTripId() : null);
        boolean isOwner = TripSecurityService.ROLE_OWNER.equalsIgnoreCase(member.getRole());

        return CollaboratorResponse.builder()
                .tripId(tripId)
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(member.getRole())
                .status(member.getStatus())
                .isOwner(isOwner)
                .joinedAt(member.getJoinedAt())
                .build();
    }

    public static CollaboratorResponse fromOwner(Trip trip) {
        User owner = trip.getOwner();
        return CollaboratorResponse.builder()
                .tripId(trip.getTripId())
                .userId(owner.getUserId())
                .username(owner.getUsername())
                .email(owner.getEmail())
                .avatarUrl(owner.getAvatarUrl())
                .role(TripSecurityService.ROLE_OWNER)
                .status(TripSecurityService.STATUS_ACTIVE)
                .isOwner(true)
                .joinedAt(trip.getCreatedAt())
                .build();
    }
}
