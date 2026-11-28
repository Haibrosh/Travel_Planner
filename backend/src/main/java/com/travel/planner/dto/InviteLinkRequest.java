package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO tùy chọn khi chủ chuyến đi tạo link mời cộng tác.
 * Mặc định role là COLLABORATOR nếu không truyền.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InviteLinkRequest {
    private String role;
}
