package com.travel.planner.controller;

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
 * Chức năng: Cung cấp các REST API quản lý chi phí và chia tiền cho chuyến đi
 * tại '/api/v1/trips/{tripId}/budgets' và '/api/v1/trips/{tripId}/expenses'.
 */
@RestController
@RequestMapping({"/api/v1/trips/{tripId}/budgets", "/api/v1/trips/{tripId}/expenses"})
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Quản lý chi phí và chia tiền cho các thành viên trong chuyến đi")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các khoản chi phí của chuyến đi (kèm chi tiết chia tiền)")
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @PathVariable("tripId") Long tripId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(expenseService.getExpenses(tripId, currentUser.getUser()));
    }

    @PostMapping
    @Operation(summary = "Tạo mới một khoản chi phí và tự động chia tiền (EQUAL / CUSTOM)")
    public ResponseEntity<ExpenseResponse> createExpense(
            @PathVariable("tripId") Long tripId,
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ExpenseResponse created = expenseService.createExpense(tripId, request, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{expenseId}")
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

    @DeleteMapping("/{expenseId}")
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
