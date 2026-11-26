package com.travel.planner.service;

import com.travel.planner.dto.BudgetSummaryResponse;
import com.travel.planner.dto.BudgetUpdateRequest;
import com.travel.planner.dto.ExpenseCategorySummaryResponse;
import com.travel.planner.dto.ExpenseRequest;
import com.travel.planner.dto.ExpenseResponse;
import com.travel.planner.dto.ExpenseSplitRequest;
import com.travel.planner.model.Expense;
import com.travel.planner.model.ExpenseCategory;
import com.travel.planner.model.ExpenseSplit;
import com.travel.planner.model.Trip;
import com.travel.planner.model.TripMember;
import com.travel.planner.model.TripMemberId;
import com.travel.planner.model.User;
import com.travel.planner.repository.ExpenseCategorySummaryProjection;
import com.travel.planner.repository.ExpenseRepository;
import com.travel.planner.repository.ExpenseSplitRepository;
import com.travel.planner.repository.TripMemberRepository;
import com.travel.planner.repository.TripRepository;
import com.travel.planner.security.TripSecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Chức năng: Xử lý nghiệp vụ quản lý chi phí (expenses), chia tiền (expense_splits),
 * cập nhật ngân sách và thống kê tổng hợp chi phí của chuyến đi.
 */
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private static final String SPLIT_EQUAL = "EQUAL";
    private static final String SPLIT_CUSTOM = "CUSTOM";
    private static final String MEMBER_ACTIVE = "ACTIVE";
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("999999999999999");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final long TOTAL_PERCENTAGE_UNITS = 10_000L; // 100.00% theo bước 0.01%

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripRepository tripRepository;
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

    // Thống kê tổng hợp chi phí, số dư ngân sách và cơ cấu phần trăm theo hạng mục (bù phần dư tổng 100.00%)
    @Transactional(readOnly = true)
    public BudgetSummaryResponse getBudgetSummary(Long tripId, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);
        return buildBudgetSummary(trip);
    }

    // Cập nhật riêng ngân sách dự kiến cho chuyến đi và trả về thống kê mới nhất
    @Transactional
    public BudgetSummaryResponse updateTripBudget(
            Long tripId,
            BudgetUpdateRequest request,
            User currentUser
    ) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        BigDecimal normalizedBudget = TripService.normalizeBudget(request.getBudget());
        if (normalizedBudget == null) {
            throw new IllegalArgumentException("Ngân sách dự kiến (budget) không được để trống.");
        }

        trip.setBudget(normalizedBudget);
        Trip savedTrip = tripRepository.saveAndFlush(trip);
        return buildBudgetSummary(savedTrip);
    }

    // Tạo khoản chi mới và tự động sinh bản ghi chia tiền theo EQUAL hoặc CUSTOM
    @Transactional
    public ExpenseResponse createExpense(Long tripId, ExpenseRequest request, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        BigDecimal amount = normalizePositiveIntegerAmount(request.getAmount(), "Số tiền khoản chi (amount)");
        String splitMethod = resolveSplitMethod(request.getSplitMethod());
        ExpenseCategory category = request.getCategory() != null
                ? request.getCategory()
                : ExpenseCategory.OTHER;
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
        ExpenseCategory category = request.getCategory() != null
                ? request.getCategory()
                : (expense.getCategory() != null ? expense.getCategory() : ExpenseCategory.OTHER);
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

    private BudgetSummaryResponse buildBudgetSummary(Trip trip) {
        List<ExpenseCategorySummaryProjection> rawRows =
                expenseRepository.findCategorySummariesByTripId(trip.getTripId());

        // Gộp các bản ghi cùng hạng mục (phòng trường hợp dữ liệu cũ có alias khác chuỗi)
        Map<ExpenseCategory, CategoryAccumulator> grouped = new EnumMap<>(ExpenseCategory.class);
        BigDecimal totalSpent = BigDecimal.ZERO;
        long totalExpenseCount = 0L;

        for (ExpenseCategorySummaryProjection row : rawRows) {
            BigDecimal rowAmount = row.getTotalAmount() != null ? row.getTotalAmount() : BigDecimal.ZERO;
            long rowCount = row.getExpenseCount() != null ? row.getExpenseCount() : 0L;
            if (rowAmount.compareTo(BigDecimal.ZERO) <= 0 || rowCount <= 0) {
                continue;
            }
            ExpenseCategory category = row.getCategory() != null ? row.getCategory() : ExpenseCategory.OTHER;
            CategoryAccumulator acc = grouped.computeIfAbsent(category, CategoryAccumulator::new);
            acc.add(rowAmount, rowCount);
            totalSpent = totalSpent.add(rowAmount);
            totalExpenseCount += rowCount;
        }

        List<CategoryAccumulator> sortedBuckets = new ArrayList<>(grouped.values());
        sortedBuckets.sort(Comparator
                .comparing(CategoryAccumulator::getTotalAmount, Comparator.reverseOrder())
                .thenComparing(acc -> acc.getCategory().name()));

        List<ExpenseCategorySummaryResponse> categoryBreakdown =
                allocatePercentagesWithLargestRemainder(sortedBuckets, totalSpent);

        BigDecimal totalBudget = trip.getBudget();
        BigDecimal remainingBudget = totalBudget != null ? totalBudget.subtract(totalSpent) : null;
        boolean isOverBudget = totalBudget != null && totalSpent.compareTo(totalBudget) > 0;
        BigDecimal budgetUsedPercentage = calculateBudgetUsedPercentage(totalBudget, totalSpent);

        return BudgetSummaryResponse.builder()
                .tripId(trip.getTripId())
                .totalBudget(totalBudget)
                .totalSpent(totalSpent)
                .remainingBudget(remainingBudget)
                .budgetUsedPercentage(budgetUsedPercentage)
                .isOverBudget(isOverBudget)
                .expenseCount(totalExpenseCount)
                .categoryBreakdown(categoryBreakdown)
                .build();
    }

    private BigDecimal calculateBudgetUsedPercentage(BigDecimal totalBudget, BigDecimal totalSpent) {
        if (totalBudget == null) {
            return null;
        }
        if (totalBudget.compareTo(BigDecimal.ZERO) == 0) {
            return totalSpent.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                    : null;
        }
        return totalSpent.multiply(ONE_HUNDRED).divide(totalBudget, 2, RoundingMode.HALF_UP);
    }

    // Phân bổ phần trăm bằng thuật toán Largest Remainder (Hamilton) để tổng các hạng mục luôn bằng 100.00%
    private List<ExpenseCategorySummaryResponse> allocatePercentagesWithLargestRemainder(
            List<CategoryAccumulator> sortedBuckets,
            BigDecimal totalSpent
    ) {
        if (sortedBuckets.isEmpty() || totalSpent.compareTo(BigDecimal.ZERO) <= 0) {
            return Collections.emptyList();
        }

        int n = sortedBuckets.size();
        long[] units = new long[n];
        BigDecimal[] remainders = new BigDecimal[n];
        long assignedUnits = 0L;

        for (int i = 0; i < n; i++) {
            BigDecimal scaled = sortedBuckets.get(i).getTotalAmount()
                    .multiply(BigDecimal.valueOf(TOTAL_PERCENTAGE_UNITS));
            BigDecimal[] divAndRem = scaled.divideAndRemainder(totalSpent);
            units[i] = divAndRem[0].longValueExact();
            remainders[i] = divAndRem[1];
            assignedUnits += units[i];
        }

        long missingUnits = TOTAL_PERCENTAGE_UNITS - assignedUnits;
        if (missingUnits > 0) {
            Integer[] order = new Integer[n];
            for (int i = 0; i < n; i++) {
                order[i] = i;
            }
            Arrays.sort(order, Comparator
                    .<Integer, BigDecimal>comparing(idx -> remainders[idx], Comparator.reverseOrder())
                    .thenComparing(idx -> sortedBuckets.get(idx).getTotalAmount(), Comparator.reverseOrder())
                    .thenComparingInt(idx -> idx));

            for (int k = 0; k < missingUnits && k < n; k++) {
                units[order[k]] += 1L;
            }
        }

        List<ExpenseCategorySummaryResponse> result = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            CategoryAccumulator acc = sortedBuckets.get(i);
            result.add(ExpenseCategorySummaryResponse.builder()
                    .category(acc.getCategory())
                    .categoryLabel(acc.getCategory().getLabel())
                    .totalAmount(acc.getTotalAmount())
                    .expenseCount(acc.getExpenseCount())
                    .percentage(BigDecimal.valueOf(units[i], 2))
                    .build());
        }
        return result;
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

    private static final class CategoryAccumulator {
        private final ExpenseCategory category;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private long expenseCount = 0L;

        private CategoryAccumulator(ExpenseCategory category) {
            this.category = category;
        }

        private void add(BigDecimal amount, long count) {
            this.totalAmount = this.totalAmount.add(amount);
            this.expenseCount += count;
        }

        private ExpenseCategory getCategory() {
            return category;
        }

        private BigDecimal getTotalAmount() {
            return totalAmount;
        }

        private long getExpenseCount() {
            return expenseCount;
        }
    }
}
