package com.travel.planner.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Chức năng: DTO nhận thông tin thành viên và số tiền chia (bắt buộc nhập splitAmount khi splitMethod = CUSTOM).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSplitRequest {

    @NotNull(message = "ID thành viên (userId) không được để trống")
    private Long userId;

    @DecimalMin(value = "1", message = "Số tiền chia (splitAmount) phải lớn hơn 0")
    private BigDecimal splitAmount;
}
