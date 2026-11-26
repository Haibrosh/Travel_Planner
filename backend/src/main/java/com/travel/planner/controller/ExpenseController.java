package com.travel.planner.controller;

import com.travel.planner.dto.BudgetSummaryResponse;
import com.travel.planner.dto.BudgetUpdateRequest;
import com.travel.planner.dto.ExpenseRequest;
import com.travel.planner.dto.ExpenseResponse;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Chức năng: Cung cấp các REST API quản lý chi phí, chia tiền, ngân sách dự kiến và thống kê
 * tại '/api/v1/trips/{tripId}/budgets' và '/api/v1/trips/{tripId}/expenses'.
 */
@RestController
@RequestMapping("/api/v1/trips/{tripId}")
@RequiredArgsConstructor
@Tag(name = "Expenses & Budgets", description = "Quản lý chi phí, chia tiền, ngân sách và thống kê tổng hợp của chuyến đi")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping({"/budgets", "/expenses"})
    @Operation(summary = "Lấy danh sách các khoản chi phí của chuyến đi (kèm chi tiết chia tiền)")
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @PathVariable("tripId") Long tripId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(expenseService.getExpenses(tripId, currentUser.getUser()));
    }

    @GetMapping({"/budgets/summary", "/expenses/summary"})
    @Operation(summary = "Thống kê tổng hợp chi phí, số tiền còn lại so với ngân sách và cơ cấu phần trăm theo hạng mục")
    public ResponseEntity<BudgetSummaryResponse> getBudgetSummary(
            @PathVariable("tripId") Long tripId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(expenseService.getBudgetSummary(tripId, currentUser.getUser()));
    }

    @PatchMapping("/budgets")
    @Operation(summary = "Cập nhật ngân sách dự kiến cho chuyến đi")
    public ResponseEntity<BudgetSummaryResponse> updateTripBudget(
            @PathVariable("tripId") Long tripId,
            @Valid @RequestBody BudgetUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(expenseService.updateTripBudget(tripId, request, currentUser.getUser()));
    }

    @PostMapping({"/budgets", "/expenses"})
    @Operation(summary = "Tạo mới một khoản chi phí và tự động chia tiền (EQUAL / CUSTOM)")
    public ResponseEntity<ExpenseResponse> createExpense(
            @PathVariable("tripId") Long tripId,
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ExpenseResponse created = expenseService.createExpense(tripId, request, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping({"/budgets/{expenseId}", "/expenses/{expenseId}"})
    @Operation(summary = "Cập nhật thông tin khoản chi phí và tính lại chia tiền")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable("tripId") Long tripId,
            @PathVariable("expenseId") Long expenseId,
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ExpenseResponse updated = expenseService.updateExpense(tripId, expenseId, request, currentUser.getUser());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping({"/budgets/{expenseId}", "/expenses/{expenseId}"})
    @Operation(summary = "Xóa một khoản chi phí khỏi chuyến đi")
    public ResponseEntity<Map<String, String>> deleteExpense(
            @PathVariable("tripId") Long tripId,
            @PathVariable("expenseId") Long expenseId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        expenseService.deleteExpense(tripId, expenseId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("message", "Xóa khoản chi thành công."));
    }
}
