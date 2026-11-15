package com.travel.planner.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Chức năng: DTO nhận dữ liệu đầu vào khi tạo mới (POST) hoặc cập nhật (PUT) khoản chi phí của chuyến đi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequest {

    @NotBlank(message = "Tên khoản chi (title) không được để trống")
    @Size(max = 255, message = "Tên khoản chi không được vượt quá 255 ký tự")
    private String title;

    @Size(max = 50, message = "Danh mục chi phí (category) không được vượt quá 50 ký tự")
    private String category;

    @NotNull(message = "Số tiền (amount) không được để trống")
    @DecimalMin(value = "1", message = "Số tiền (amount) phải lớn hơn 0")
    private BigDecimal amount;

    private Long paidByUserId;

    // EQUAL hoặc CUSTOM (mặc định EQUAL nếu bỏ trống)
    private String splitMethod;

    private LocalDate expenseDate;

    private String notes;

    @Valid
    private List<ExpenseSplitRequest> splits;
}
