package com.travel.planner.repository;

import com.travel.planner.model.ExpenseCategory;

import java.math.BigDecimal;

/**
 * Chức năng: Projection hứng kết quả truy vấn tổng hợp chi phí theo hạng mục từ bảng 'app.expenses'.
 */
public interface ExpenseCategorySummaryProjection {

    ExpenseCategory getCategory();

    BigDecimal getTotalAmount();

    Long getExpenseCount();
}
