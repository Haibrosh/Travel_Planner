package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về kết quả khi user xác thực token lời mời và tham gia chuyến đi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinTripResponse {

    private Long tripId;
    private String tripName;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private String status;
    private Boolean alreadyMember;
    private LocalDateTime joinedAt;
    private String message;
    private TripResponse trip;
}
