package com.travel.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Chức năng: DTO nhận dữ liệu đầu vào từ Client khi tạo mới chuyến đi (POST /api/v1/trips).
 */
@Data
public class TripRequest {

    @NotBlank(message = "Mã tỉnh/điểm đến (provinceCode) không được để trống")
    @Size(max = 2, message = "Mã tỉnh gồm tối đa 2 ký tự (chuẩn destinations_v2)")
    private String provinceCode;

    @NotBlank(message = "Tên chuyến đi không được để trống")
    @Size(max = 255, message = "Tên chuyến đi không được vượt quá 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Ngày bắt đầu (startDate) không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc (endDate) không được để trống")
    private LocalDate endDate;
}
