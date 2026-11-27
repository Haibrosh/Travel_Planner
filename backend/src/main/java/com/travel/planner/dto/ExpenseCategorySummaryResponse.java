package com.travel.planner.dto;

import com.travel.planner.model.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Chức năng: DTO thống kê tổng chi phí và tỷ trọng phần trăm của một hạng mục chi tiêu.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseCategorySummaryResponse {

    private ExpenseCategory category;
    private String categoryLabel;
    private BigDecimal totalAmount;
    private Long expenseCount;
    private BigDecimal percentage;
}
