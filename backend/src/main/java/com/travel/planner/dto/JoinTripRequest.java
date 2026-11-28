package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO tùy chọn hỗ trợ gửi token qua request body khi tham gia chuyến đi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinTripRequest {
    private String token;
}
