package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Chức năng: DTO trả thông tin thống kê tổng hợp chi phí, số dư ngân sách và cơ cấu theo hạng mục.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryResponse {

    private Long tripId;
    private BigDecimal totalBudget;
    private BigDecimal totalSpent;
    private BigDecimal remainingBudget;
    private BigDecimal budgetUsedPercentage;

    // Dùng kiểu Boolean boxed để Jackson serialize đúng key JSON "isOverBudget"
    private Boolean isOverBudget;

    private Long expenseCount;
    private List<ExpenseCategorySummaryResponse> categoryBreakdown;
}
