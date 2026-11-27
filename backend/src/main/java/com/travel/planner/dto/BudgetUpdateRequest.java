package com.travel.planner.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Chức năng: DTO nhận dữ liệu cập nhật ngân sách dự kiến (budget) riêng cho chuyến đi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetUpdateRequest {

    @NotNull(message = "Ngân sách dự kiến (budget) không được để trống")
    @DecimalMin(value = "0", message = "Ngân sách dự kiến không được âm")
    private BigDecimal budget;
}
