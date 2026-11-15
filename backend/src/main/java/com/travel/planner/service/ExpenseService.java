package com.travel.planner.service;

import com.travel.planner.dto.ExpenseRequest;
import com.travel.planner.dto.ExpenseResponse;
import com.travel.planner.dto.ExpenseSplitRequest;
import com.travel.planner.model.Expense;
import com.travel.planner.model.ExpenseSplit;
import com.travel.planner.model.Trip;
import com.travel.planner.model.TripMember;
import com.travel.planner.model.TripMemberId;
import com.travel.planner.model.User;
import com.travel.planner.repository.ExpenseRepository;
import com.travel.planner.repository.ExpenseSplitRepository;
import com.travel.planner.repository.TripMemberRepository;
import com.travel.planner.security.TripSecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Chức năng: Xử lý nghiệp vụ quản lý chi phí (expenses) và chia tiền (expense_splits) của chuyến đi.
 */
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private static final String DEFAULT_CATEGORY = "OTHER";
    private static final String SPLIT_EQUAL = "EQUAL";
    private static final String SPLIT_CUSTOM = "CUSTOM";
    private static final String MEMBER_ACTIVE = "ACTIVE";
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("999999999999999");

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripSecurityService tripSecurityService;

    // Lấy toàn bộ danh sách khoản chi của chuyến đi kèm chi tiết chia tiền
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(Long tripId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        List<Expense> expenses = expenseRepository.findAllByTripIdWithPayer(tripId);
        if (expenses.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, List<ExpenseSplit>> splitsByExpenseId = expenseSplitRepository.findAllByTripIdWithUser(tripId)
                .stream()
                .collect(Collectors.groupingBy(split -> split.getExpense().getExpenseId()));

        return expenses.stream()
                .map(expense -> ExpenseResponse.fromEntity(
                        expense,
                        splitsByExpenseId.getOrDefault(expense.getExpenseId(), Collections.emptyList())
                ))
                .toList();
    }

    // Tạo khoản chi mới và tự động sinh bản ghi chia tiền theo EQUAL hoặc CUSTOM
    @Transactional
    public ExpenseResponse createExpense(Long tripId, ExpenseRequest request, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        BigDecimal amount = normalizePositiveIntegerAmount(request.getAmount(), "Số tiền khoản chi (amount)");
        String splitMethod = resolveSplitMethod(request.getSplitMethod());
        String category = resolveCategory(request.getCategory());
        LocalDate expenseDate = request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now();

        Long payerId = request.getPaidByUserId() != null
                ? request.getPaidByUserId()
                : currentUser.getUserId();
        User paidBy = resolveMemberUser(trip, payerId, Collections.emptySet());

        Expense expense = Expense.builder()
                .trip(trip)
                .paidBy(paidBy)
                .title(request.getTitle().trim())
                .category(category)
                .amount(amount)
                .splitMethod(splitMethod)
                .expenseDate(expenseDate)
                .notes(request.getNotes())
                .build();

        Expense savedExpense = expenseRepository.saveAndFlush(expense);
        List<ExpenseSplit> splits = buildSplits(
                trip, savedExpense, amount, splitMethod, request.getSplits(), Collections.emptySet());
        List<ExpenseSplit> savedSplits = expenseSplitRepository.saveAllAndFlush(splits);

        return ExpenseResponse.fromEntity(savedExpense, savedSplits);
    }

    // Cập nhật khoản chi và tính lại toàn bộ bản ghi chia tiền
    @Transactional
    public ExpenseResponse updateExpense(
            Long tripId,
            Long expenseId,
            ExpenseRequest request,
            User currentUser
    ) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        Expense expense = expenseRepository.findByExpenseIdAndTripIdWithPayer(expenseId, tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khoản chi với ID: " + expenseId));

        BigDecimal amount = normalizePositiveIntegerAmount(request.getAmount(), "Số tiền khoản chi (amount)");
        String splitMethod = resolveSplitMethod(request.getSplitMethod());
        String category = request.getCategory() != null
                ? resolveCategory(request.getCategory())
                : expense.getCategory();
        LocalDate expenseDate = request.getExpenseDate() != null
                ? request.getExpenseDate()
                : expense.getExpenseDate();

        Long existingPayerId = expense.getPaidBy().getUserId();
        Long payerId = request.getPaidByUserId() != null ? request.getPaidByUserId() : existingPayerId;
        User paidBy = resolveMemberUser(trip, payerId, Set.of(existingPayerId));

        // Bảo toàn lịch sử nếu khoản chi cũ có thành viên hiện đã rời nhóm
        Set<Long> existingSplitUserIds = expenseSplitRepository.findAllByExpenseIdWithUser(expenseId)
                .stream()
                .map(split -> split.getUser().getUserId())
                .collect(Collectors.toSet());

        expense.setPaidBy(paidBy);
        expense.setTitle(request.getTitle().trim());
        expense.setCategory(category);
        expense.setAmount(amount);
        expense.setSplitMethod(splitMethod);
        expense.setExpenseDate(expenseDate);
        expense.setNotes(request.getNotes());

        Expense savedExpense = expenseRepository.saveAndFlush(expense);
        expenseSplitRepository.deleteAllByExpenseId(expenseId);

        List<ExpenseSplit> newSplits = buildSplits(
                trip, savedExpense, amount, splitMethod, request.getSplits(), existingSplitUserIds);
        List<ExpenseSplit> savedSplits = expenseSplitRepository.saveAllAndFlush(newSplits);

        return ExpenseResponse.fromEntity(savedExpense, savedSplits);
    }

    // Xóa khoản chi (kèm toàn bộ chi tiết chia tiền)
    @Transactional
    public void deleteExpense(Long tripId, Long expenseId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        Expense expense = expenseRepository.findByExpenseIdAndTripIdWithPayer(expenseId, tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khoản chi với ID: " + expenseId));

        expenseSplitRepository.deleteAllByExpenseId(expenseId);
        expenseRepository.delete(expense);
    }

    private List<ExpenseSplit> buildSplits(
            Trip trip,
            Expense expense,
            BigDecimal amount,
            String splitMethod,
            List<ExpenseSplitRequest> splitRequests,
            Set<Long> allowedInactiveUserIds
    ) {
        if (SPLIT_EQUAL.equals(splitMethod)) {
            return buildEqualSplits(trip, expense, amount, splitRequests, allowedInactiveUserIds);
        }
        return buildCustomSplits(trip, expense, amount, splitRequests, allowedInactiveUserIds);
    }

    private List<ExpenseSplit> buildEqualSplits(
            Trip trip,
            Expense expense,
            BigDecimal amount,
            List<ExpenseSplitRequest> splitRequests,
            Set<Long> allowedInactiveUserIds
    ) {
        List<User> participants;
        if (splitRequests == null || splitRequests.isEmpty()) {
            participants = resolveActiveMemberUsers(trip);
        } else {
            participants = new ArrayList<>(splitRequests.size());
            Set<Long> seenUserIds = new HashSet<>();
            for (ExpenseSplitRequest item : splitRequests) {
                if (item.getUserId() == null) {
                    throw new IllegalArgumentException("ID thành viên (userId) trong danh sách chia tiền không được để trống.");
                }
                if (!seenUserIds.add(item.getUserId())) {
                    throw new IllegalArgumentException("Danh sách chia tiền không được chứa thành viên trùng lặp.");
                }
                participants.add(resolveMemberUser(trip, item.getUserId(), allowedInactiveUserIds));
            }
        }

        int count = participants.size();
        if (amount.compareTo(BigDecimal.valueOf(count)) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Số tiền (%s) quá nhỏ để chia đều cho %d thành viên (mỗi phần chia phải lớn hơn 0).",
                    amount.toPlainString(), count));
        }

        BigDecimal[] divAndRem = amount.divideAndRemainder(BigDecimal.valueOf(count));
        BigDecimal baseAmount = divAndRem[0];
        int remainder = divAndRem[1].intValue();

        List<ExpenseSplit> result = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            BigDecimal share = i < remainder ? baseAmount.add(BigDecimal.ONE) : baseAmount;
            result.add(ExpenseSplit.builder()
                    .expense(expense)
                    .trip(trip)
                    .user(participants.get(i))
                    .splitAmount(share)
                    .build());
        }
        return result;
    }

    private List<ExpenseSplit> buildCustomSplits(
            Trip trip,
            Expense expense,
            BigDecimal amount,
            List<ExpenseSplitRequest> splitRequests,
            Set<Long> allowedInactiveUserIds
    ) {
        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new IllegalArgumentException("Chế độ chia tiền 'CUSTOM' bắt buộc phải cung cấp danh sách chia tiền (splits).");
        }

        List<ExpenseSplit> result = new ArrayList<>(splitRequests.size());
        Set<Long> seenUserIds = new HashSet<>();
        BigDecimal totalSplit = BigDecimal.ZERO;

        for (ExpenseSplitRequest item : splitRequests) {
            if (item.getUserId() == null) {
                throw new IllegalArgumentException("ID thành viên (userId) trong danh sách chia tiền không được để trống.");
            }
            if (!seenUserIds.add(item.getUserId())) {
                throw new IllegalArgumentException("Danh sách chia tiền không được chứa thành viên trùng lặp.");
            }

            BigDecimal share = normalizePositiveIntegerAmount(
                    item.getSplitAmount(),
                    "Số tiền chia cho thành viên (userId=" + item.getUserId() + ")"
            );
            User memberUser = resolveMemberUser(trip, item.getUserId(), allowedInactiveUserIds);

            totalSplit = totalSplit.add(share);
            result.add(ExpenseSplit.builder()
                    .expense(expense)
                    .trip(trip)
                    .user(memberUser)
                    .splitAmount(share)
                    .build());
        }

        if (totalSplit.compareTo(amount) != 0) {
            throw new IllegalArgumentException(String.format(
                    "Tổng số tiền chia (%s) phải bằng tổng số tiền khoản chi (%s).",
                    totalSplit.toPlainString(), amount.toPlainString()));
        }
        return result;
    }

    private List<User> resolveActiveMemberUsers(Trip trip) {
        Long tripId = trip.getTripId();
        List<TripMember> activeMembers = new ArrayList<>(
                tripMemberRepository.findByTripIdAndStatusWithUser(tripId, MEMBER_ACTIVE));

        Long ownerId = trip.getOwner().getUserId();
        boolean ownerPresent = activeMembers.stream()
                .anyMatch(m -> m.getUser().getUserId().equals(ownerId));
        if (!ownerPresent && tripMemberRepository.findByTripIdAndUserIdWithUser(tripId, ownerId).isEmpty()) {
            activeMembers.add(0, ensureOwnerMemberIfMissing(trip));
        }

        if (activeMembers.isEmpty()) {
            throw new IllegalArgumentException("Chuyến đi chưa có thành viên nào đang hoạt động để chia tiền.");
        }
        return activeMembers.stream().map(TripMember::getUser).toList();
    }

    private User resolveMemberUser(Trip trip, Long userId, Set<Long> allowedInactiveUserIds) {
        Long tripId = trip.getTripId();
        TripMember member = tripMemberRepository.findByTripIdAndUserIdWithUser(tripId, userId)
                .orElseGet(() -> {
                    if (userId.equals(trip.getOwner().getUserId())) {
                        return ensureOwnerMemberIfMissing(trip);
                    }
                    throw new IllegalArgumentException(
                            "Người dùng (ID: " + userId + ") không phải là thành viên của chuyến đi này.");
                });

        if (!MEMBER_ACTIVE.equals(member.getStatus())
                && (allowedInactiveUserIds == null || !allowedInactiveUserIds.contains(userId))) {
            throw new IllegalArgumentException(
                    "Thành viên (ID: " + userId + ") đã rời khỏi chuyến đi và không thể gán vào khoản chi mới.");
        }
        return member.getUser();
    }

    // Tự đồng bộ owner vào app.trip_members cho các chuyến đi tạo trước V6 (nếu thiếu)
    private TripMember ensureOwnerMemberIfMissing(Trip trip) {
        Long tripId = trip.getTripId();
        Long ownerId = trip.getOwner().getUserId();
        TripMember ownerMember = TripMember.builder()
                .id(new TripMemberId(tripId, ownerId))
                .trip(trip)
                .user(trip.getOwner())
                .role("OWNER")
                .status(MEMBER_ACTIVE)
                .build();
        return tripMemberRepository.saveAndFlush(ownerMember);
    }

    private BigDecimal normalizePositiveIntegerAmount(BigDecimal rawAmount, String fieldLabel) {
        if (rawAmount == null) {
            throw new IllegalArgumentException(fieldLabel + " không được để trống.");
        }
        BigDecimal normalized = rawAmount.stripTrailingZeros();
        if (normalized.scale() > 0) {
            throw new IllegalArgumentException(fieldLabel + " phải là số nguyên dương (không có phần thập phân).");
        }
        BigDecimal integerAmount = normalized.setScale(0, RoundingMode.UNNECESSARY);
        if (integerAmount.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException(fieldLabel + " phải lớn hơn 0.");
        }
        if (integerAmount.compareTo(MAX_AMOUNT) > 0) {
            throw new IllegalArgumentException(fieldLabel + " vượt quá giới hạn cho phép (tối đa 15 chữ số).");
        }
        return integerAmount;
    }

    private String resolveSplitMethod(String rawSplitMethod) {
        if (rawSplitMethod == null || rawSplitMethod.trim().isEmpty()) {
            return SPLIT_EQUAL;
        }
        String normalized = rawSplitMethod.trim().toUpperCase(Locale.ROOT);
        if (!SPLIT_EQUAL.equals(normalized) && !SPLIT_CUSTOM.equals(normalized)) {
            throw new IllegalArgumentException("Phương thức chia tiền (splitMethod) chỉ hỗ trợ 'EQUAL' hoặc 'CUSTOM'.");
        }
        return normalized;
    }

    private String resolveCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.trim().isEmpty()) {
            return DEFAULT_CATEGORY;
        }
        return rawCategory.trim();
    }
}
