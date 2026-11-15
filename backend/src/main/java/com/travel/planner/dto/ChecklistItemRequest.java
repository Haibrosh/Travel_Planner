package com.travel.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Chức năng: DTO nhận dữ liệu đầu vào khi thêm mới (POST) hoặc cập nhật (PUT) một món đồ hành lý.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemRequest {

    @NotBlank(message = "Tên món đồ hành lý không được để trống")
    @Size(max = 255, message = "Tên món đồ hành lý không được vượt quá 255 ký tự")
    private String name;

    @Size(max = 100, message = "Danh mục hành lý không được vượt quá 100 ký tự")
    private String category;

    private Boolean isCompleted;
}
