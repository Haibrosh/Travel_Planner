package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Chức năng: DTO phản hồi chứa JWT Token trả về cho Frontend sau khi xác thực thành công.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String username;
    // private String role;
}
