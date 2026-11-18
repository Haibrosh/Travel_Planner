package com.travel.planner.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Chức năng: DTO chuẩn hóa phản hồi lỗi trả về cho Frontend với cấu trúc đồng nhất { status, message, timestamp }.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonPropertyOrder({"status", "message", "timestamp", "error"})
public class ErrorResponse {
    private int status;
    private String message;
    private LocalDateTime timestamp;
    private String error;
}
