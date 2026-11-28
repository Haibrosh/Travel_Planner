package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về đường link mời tham gia chuyến đi chứa JWT hiệu lực 7 ngày.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InviteLinkResponse {

    private Long tripId;
    private String token;
    private String inviteLink;
    private String role;
    private Long expiresInSeconds;
    private LocalDateTime expiresAt;
}
