package com.travel.planner.dto;

import com.travel.planner.model.Expense;
import com.travel.planner.model.ExpenseCategory;
import com.travel.planner.model.ExpenseSplit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Chức năng: DTO trả thông tin chi tiết một khoản chi phí kèm danh sách chia tiền cho các thành viên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private Long expenseId;
    private Long tripId;
    private Long paidByUserId;
    private String paidByUsername;
    private String title;
    private ExpenseCategory category;
    private String categoryLabel;
    private BigDecimal amount;
    private String splitMethod;
    private LocalDate expenseDate;
    private String notes;
    private List<ExpenseSplitResponse> splits;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ExpenseResponse fromEntity(Expense expense, List<ExpenseSplit> splits) {
        if (expense == null) {
            return null;
        }
        List<ExpenseSplitResponse> splitResponses = splits == null
                ? Collections.emptyList()
                : splits.stream()
                        .map(ExpenseSplitResponse::fromEntity)
                        .toList();

        ExpenseCategory resolvedCategory = expense.getCategory() != null
                ? expense.getCategory()
                : ExpenseCategory.OTHER;

        return ExpenseResponse.builder()
                .expenseId(expense.getExpenseId())
                .tripId(expense.getTrip() != null ? expense.getTrip().getTripId() : null)
                .paidByUserId(expense.getPaidBy() != null ? expense.getPaidBy().getUserId() : null)
                .paidByUsername(expense.getPaidBy() != null ? expense.getPaidBy().getUsername() : null)
                .title(expense.getTitle())
                .category(resolvedCategory)
                .categoryLabel(resolvedCategory.getLabel())
                .amount(expense.getAmount())
                .splitMethod(expense.getSplitMethod())
                .expenseDate(expense.getExpenseDate())
                .notes(expense.getNotes())
                .splits(splitResponses)
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
