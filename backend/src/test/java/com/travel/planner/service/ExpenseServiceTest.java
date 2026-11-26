package com.travel.planner.service;

import com.travel.planner.dto.BudgetSummaryResponse;
import com.travel.planner.dto.BudgetUpdateRequest;
import com.travel.planner.dto.ExpenseRequest;
import com.travel.planner.dto.ExpenseResponse;
import com.travel.planner.dto.ExpenseSplitRequest;
import com.travel.planner.model.Expense;
import com.travel.planner.model.ExpenseCategory;
import com.travel.planner.model.ExpenseCategoryConverter;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripSecurityService tripSecurityService;

    @InjectMocks
    private ExpenseService expenseService;

    private User user1;
    private User user2;
    private User user3;
    private Trip trip;
    private TripMember member1;
    private TripMember member2;
    private TripMember member3;

    @BeforeEach
    void setUp() {
        user1 = User.builder().userId(1L).username("owner").email("owner@test.com").build();
        user2 = User.builder().userId(2L).username("ban2").email("ban2@test.com").build();
        user3 = User.builder().userId(3L).username("ban3").email("ban3@test.com").build();

        trip = Trip.builder()
                .tripId(10L)
                .owner(user1)
                .name("Chuyến đi Đà Nẵng")
                .budget(new BigDecimal("5000000"))
                .build();

        member1 = TripMember.builder().id(new TripMemberId(10L, 1L)).trip(trip).user(user1).role("OWNER").status("ACTIVE").build();
        member2 = TripMember.builder().id(new TripMemberId(10L, 2L)).trip(trip).user(user2).role("COLLABORATOR").status("ACTIVE").build();
        member3 = TripMember.builder().id(new TripMemberId(10L, 3L)).trip(trip).user(user3).role("COLLABORATOR").status("ACTIVE").build();
    }

    @Test
    @DisplayName("1. Lấy danh sách khoản chi kèm chi tiết chia tiền")
    void getExpenses_success() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        Expense expense = Expense.builder()
                .expenseId(100L).trip(trip).paidBy(user1).title("Ăn tối").category(ExpenseCategory.FOOD)
                .amount(new BigDecimal("300000")).splitMethod("EQUAL").expenseDate(LocalDate.of(2026, 11, 15)).build();
        ExpenseSplit s1 = ExpenseSplit.builder().splitId(1L).expense(expense).trip(trip).user(user1).splitAmount(new BigDecimal("150000")).build();
        ExpenseSplit s2 = ExpenseSplit.builder().splitId(2L).expense(expense).trip(trip).user(user2).splitAmount(new BigDecimal("150000")).build();

        when(expenseRepository.findAllByTripIdWithPayer(10L)).thenReturn(List.of(expense));
        when(expenseSplitRepository.findAllByTripIdWithUser(10L)).thenReturn(List.of(s1, s2));

        List<ExpenseResponse> result = expenseService.getExpenses(10L, user1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPaidByUsername()).isEqualTo("owner");
        assertThat(result.get(0).getCategory()).isEqualTo(ExpenseCategory.FOOD);
        assertThat(result.get(0).getCategoryLabel()).isEqualTo("Ăn uống");
        assertThat(result.get(0).getSplits()).hasSize(2);
    }

    @Test
    @DisplayName("2. Tạo khoản chi EQUAL tự động chia đều + phân bổ số dư cho thành viên ACTIVE")
    void createExpense_equalAutoMembers_distributesRemainder() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 1L)).thenReturn(Optional.of(member1));
        when(tripMemberRepository.findByTripIdAndStatusWithUser(10L, "ACTIVE"))
                .thenReturn(List.of(member1, member2, member3));

        when(expenseRepository.saveAndFlush(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setExpenseId(101L);
            return e;
        });
        when(expenseSplitRepository.saveAllAndFlush(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ExpenseRequest request = ExpenseRequest.builder()
                .title("Cà phê sáng")
                .amount(new BigDecimal("100000"))
                .build();

        ExpenseResponse created = expenseService.createExpense(10L, request, user1);

        assertThat(created.getExpenseId()).isEqualTo(101L);
        assertThat(created.getCategory()).isEqualTo(ExpenseCategory.OTHER);
        assertThat(created.getCategoryLabel()).isEqualTo("Khác");
        assertThat(created.getSplitMethod()).isEqualTo("EQUAL");
        assertThat(created.getSplits()).hasSize(3);
        assertThat(created.getSplits().get(0).getSplitAmount()).isEqualByComparingTo("33334");
        assertThat(created.getSplits().get(1).getSplitAmount()).isEqualByComparingTo("33333");
        assertThat(created.getSplits().get(2).getSplitAmount()).isEqualByComparingTo("33333");
    }

    @Test
    @DisplayName("3. Tạo khoản chi CUSTOM thành công khi tổng splits khớp amount")
    void createExpense_customValid_success() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(member2));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 1L)).thenReturn(Optional.of(member1));

        when(expenseRepository.saveAndFlush(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setExpenseId(102L);
            return e;
        });
        when(expenseSplitRepository.saveAllAndFlush(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ExpenseRequest request = ExpenseRequest.builder()
                .title("Vé tham quan")
                .category(ExpenseCategory.TICKET)
                .amount(new BigDecimal("500000"))
                .paidByUserId(2L)
                .splitMethod("CUSTOM")
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).splitAmount(new BigDecimal("200000")).build(),
                        ExpenseSplitRequest.builder().userId(2L).splitAmount(new BigDecimal("300000")).build()
                ))
                .build();

        ExpenseResponse created = expenseService.createExpense(10L, request, user1);

        assertThat(created.getPaidByUserId()).isEqualTo(2L);
        assertThat(created.getCategory()).isEqualTo(ExpenseCategory.TICKET);
        assertThat(created.getSplitMethod()).isEqualTo("CUSTOM");
        assertThat(created.getSplits()).hasSize(2);
    }

    @Test
    @DisplayName("4. Tạo khoản chi CUSTOM thất bại khi tổng splits khác amount")
    void createExpense_customSumMismatch_throwsIllegalArgument() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 1L)).thenReturn(Optional.of(member1));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(member2));
        when(expenseRepository.saveAndFlush(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setExpenseId(103L);
            return e;
        });

        ExpenseRequest request = ExpenseRequest.builder()
                .title("Ăn trưa")
                .amount(new BigDecimal("500000"))
                .splitMethod("CUSTOM")
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).splitAmount(new BigDecimal("200000")).build(),
                        ExpenseSplitRequest.builder().userId(2L).splitAmount(new BigDecimal("200000")).build()
                ))
                .build();

        assertThatThrownBy(() -> expenseService.createExpense(10L, request, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tổng số tiền chia");
    }

    @Test
    @DisplayName("5. Thất bại khi số tiền là số thập phân")
    void createExpense_decimalAmount_throwsIllegalArgument() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);

        ExpenseRequest request = ExpenseRequest.builder()
                .title("Nước suối")
                .amount(new BigDecimal("10000.5"))
                .build();

        assertThatThrownBy(() -> expenseService.createExpense(10L, request, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("số nguyên dương");
    }

    @Test
    @DisplayName("6. Thất bại khi người trả hoặc người chia tiền đã rời nhóm (LEFT)")
    void createExpense_leftMember_throwsIllegalArgument() {
        TripMember leftMember = TripMember.builder()
                .id(new TripMemberId(10L, 2L)).trip(trip).user(user2).role("COLLABORATOR").status("LEFT").build();
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(leftMember));

        ExpenseRequest request = ExpenseRequest.builder()
                .title("Ăn tối")
                .amount(new BigDecimal("200000"))
                .paidByUserId(2L)
                .build();

        assertThatThrownBy(() -> expenseService.createExpense(10L, request, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã rời khỏi chuyến đi");
    }

    @Test
    @DisplayName("7. Cập nhật khoản chi thành công (xóa split cũ và lưu split mới)")
    void updateExpense_success() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        Expense existing = Expense.builder()
                .expenseId(100L).trip(trip).paidBy(user1).title("Cũ").category(ExpenseCategory.OTHER)
                .amount(new BigDecimal("100000")).splitMethod("EQUAL").expenseDate(LocalDate.of(2026, 11, 15)).build();
        ExpenseSplit oldSplit = ExpenseSplit.builder().splitId(1L).expense(existing).trip(trip).user(user1).splitAmount(new BigDecimal("100000")).build();

        when(expenseRepository.findByExpenseIdAndTripIdWithPayer(100L, 10L)).thenReturn(Optional.of(existing));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 1L)).thenReturn(Optional.of(member1));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(member2));
        when(expenseSplitRepository.findAllByExpenseIdWithUser(100L)).thenReturn(List.of(oldSplit));
        when(expenseRepository.saveAndFlush(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));
        when(expenseSplitRepository.saveAllAndFlush(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ExpenseRequest request = ExpenseRequest.builder()
                .title("Mới")
                .category(ExpenseCategory.FOOD)
                .amount(new BigDecimal("400000"))
                .splitMethod("EQUAL")
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).build(),
                        ExpenseSplitRequest.builder().userId(2L).build()
                ))
                .build();

        ExpenseResponse updated = expenseService.updateExpense(10L, 100L, request, user1);

        verify(expenseSplitRepository).deleteAllByExpenseId(100L);
        assertThat(updated.getTitle()).isEqualTo("Mới");
        assertThat(updated.getCategory()).isEqualTo(ExpenseCategory.FOOD);
        assertThat(updated.getAmount()).isEqualByComparingTo("400000");
        assertThat(updated.getSplits()).hasSize(2);
        assertThat(updated.getSplits().get(0).getSplitAmount()).isEqualByComparingTo("200000");
    }

    @Test
    @DisplayName("8. Xóa khoản chi thành công")
    void deleteExpense_success() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        Expense existing = Expense.builder().expenseId(100L).trip(trip).paidBy(user1).build();
        when(expenseRepository.findByExpenseIdAndTripIdWithPayer(100L, 10L)).thenReturn(Optional.of(existing));

        expenseService.deleteExpense(10L, 100L, user1);

        verify(expenseSplitRepository).deleteAllByExpenseId(100L);
        verify(expenseRepository).delete(existing);
    }

    @Test
    @DisplayName("9. Xóa khoản chi không tồn tại -> ném EntityNotFoundException")
    void deleteExpense_notFound_throwsEntityNotFound() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(expenseRepository.findByExpenseIdAndTripIdWithPayer(999L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.deleteExpense(10L, 999L, user1))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("10. Thống kê tổng hợp ngân sách trong hạn mức với nhiều hạng mục")
    void getBudgetSummary_withinBudget_returnsAccurateBreakdown() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(expenseRepository.findCategorySummariesByTripId(10L)).thenReturn(List.of(
                projection(ExpenseCategory.ACCOMMODATION, "1800000", 1L),
                projection(ExpenseCategory.TRANSPORT, "700000", 2L)
        ));

        BudgetSummaryResponse summary = expenseService.getBudgetSummary(10L, user1);

        assertThat(summary.getTripId()).isEqualTo(10L);
        assertThat(summary.getTotalBudget()).isEqualByComparingTo("5000000");
        assertThat(summary.getTotalSpent()).isEqualByComparingTo("2500000");
        assertThat(summary.getRemainingBudget()).isEqualByComparingTo("2500000");
        assertThat(summary.getBudgetUsedPercentage()).isEqualByComparingTo("50.00");
        assertThat(summary.getIsOverBudget()).isFalse();
        assertThat(summary.getExpenseCount()).isEqualTo(3L);
        assertThat(summary.getCategoryBreakdown()).hasSize(2);
        assertThat(summary.getCategoryBreakdown().get(0).getCategory()).isEqualTo(ExpenseCategory.ACCOMMODATION);
        assertThat(summary.getCategoryBreakdown().get(0).getCategoryLabel()).isEqualTo("Khách sạn");
        assertThat(summary.getCategoryBreakdown().get(0).getPercentage()).isEqualByComparingTo("72.00");
        assertThat(summary.getCategoryBreakdown().get(1).getCategory()).isEqualTo(ExpenseCategory.TRANSPORT);
        assertThat(summary.getCategoryBreakdown().get(1).getPercentage()).isEqualByComparingTo("28.00");
    }

    @Test
    @DisplayName("11. Thống kê bù phần dư (Largest Remainder) đảm bảo tổng phần trăm luôn đúng 100.00%")
    void getBudgetSummary_largestRemainder_sumsExactlyTo100Percent() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(expenseRepository.findCategorySummariesByTripId(10L)).thenReturn(List.of(
                projection(ExpenseCategory.ACCOMMODATION, "100000", 1L),
                projection(ExpenseCategory.FOOD, "100000", 1L),
                projection(ExpenseCategory.TRANSPORT, "100000", 1L)
        ));

        BudgetSummaryResponse summary = expenseService.getBudgetSummary(10L, user1);

        assertThat(summary.getTotalSpent()).isEqualByComparingTo("300000");
        assertThat(summary.getCategoryBreakdown()).hasSize(3);
        assertThat(summary.getCategoryBreakdown().get(0).getPercentage()).isEqualByComparingTo("33.34");
        assertThat(summary.getCategoryBreakdown().get(1).getPercentage()).isEqualByComparingTo("33.33");
        assertThat(summary.getCategoryBreakdown().get(2).getPercentage()).isEqualByComparingTo("33.33");

        BigDecimal totalPercent = summary.getCategoryBreakdown().stream()
                .map(item -> item.getPercentage())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalPercent).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("12. Thống kê khi chi tiêu vượt ngân sách và khi chưa thiết lập ngân sách")
    void getBudgetSummary_overBudgetAndNullBudget_handlesCorrectly() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(expenseRepository.findCategorySummariesByTripId(10L)).thenReturn(List.of(
                projection(ExpenseCategory.FOOD, "6000000", 4L)
        ));

        BudgetSummaryResponse overBudget = expenseService.getBudgetSummary(10L, user1);
        assertThat(overBudget.getRemainingBudget()).isEqualByComparingTo("-1000000");
        assertThat(overBudget.getBudgetUsedPercentage()).isEqualByComparingTo("120.00");
        assertThat(overBudget.getIsOverBudget()).isTrue();

        trip.setBudget(null);
        when(expenseRepository.findCategorySummariesByTripId(10L)).thenReturn(List.of());
        BudgetSummaryResponse noBudgetNoExpense = expenseService.getBudgetSummary(10L, user1);
        assertThat(noBudgetNoExpense.getTotalBudget()).isNull();
        assertThat(noBudgetNoExpense.getTotalSpent()).isEqualByComparingTo("0");
        assertThat(noBudgetNoExpense.getRemainingBudget()).isNull();
        assertThat(noBudgetNoExpense.getBudgetUsedPercentage()).isNull();
        assertThat(noBudgetNoExpense.getIsOverBudget()).isFalse();
        assertThat(noBudgetNoExpense.getCategoryBreakdown()).isEmpty();
    }

    @Test
    @DisplayName("13. Cập nhật ngân sách dự kiến thành công và trả về thống kê mới")
    void updateTripBudget_valid_returnsUpdatedSummary() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);
        when(tripRepository.saveAndFlush(trip)).thenReturn(trip);
        when(expenseRepository.findCategorySummariesByTripId(10L)).thenReturn(List.of(
                projection(ExpenseCategory.TICKET, "1200000", 2L)
        ));

        BudgetSummaryResponse summary = expenseService.updateTripBudget(
                10L,
                BudgetUpdateRequest.builder().budget(new BigDecimal("8000000")).build(),
                user1
        );

        verify(tripRepository).saveAndFlush(trip);
        assertThat(trip.getBudget()).isEqualByComparingTo("8000000");
        assertThat(summary.getTotalBudget()).isEqualByComparingTo("8000000");
        assertThat(summary.getRemainingBudget()).isEqualByComparingTo("6800000");
        assertThat(summary.getBudgetUsedPercentage()).isEqualByComparingTo("15.00");
    }

    @Test
    @DisplayName("14. Từ chối ngân sách âm/thập phân và từ chối user không phải thành viên")
    void budgetSummaryAndUpdate_invalidOrUnauthorized_throws() {
        when(tripSecurityService.getTripIfMember(10L, user1)).thenReturn(trip);

        assertThatThrownBy(() -> expenseService.updateTripBudget(
                10L,
                BudgetUpdateRequest.builder().budget(new BigDecimal("1000.5")).build(),
                user1
        )).isInstanceOf(IllegalArgumentException.class);

        when(tripSecurityService.getTripIfMember(10L, user2))
                .thenThrow(new AccessDeniedException("Không có quyền"));
        assertThatThrownBy(() -> expenseService.getBudgetSummary(10L, user2))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("15. Enum ExpenseCategory và Converter parse đúng mã chuẩn lẫn alias tiếng Việt")
    void expenseCategory_parsesCodesAliasesAndLegacyDbValues() {
        assertThat(ExpenseCategory.fromValue("FOOD")).isEqualTo(ExpenseCategory.FOOD);
        assertThat(ExpenseCategory.fromValue("Ăn uống")).isEqualTo(ExpenseCategory.FOOD);
        assertThat(ExpenseCategory.fromValue("Lưu trú")).isEqualTo(ExpenseCategory.ACCOMMODATION);
        assertThat(ExpenseCategory.fromValue("Khách sạn")).isEqualTo(ExpenseCategory.ACCOMMODATION);
        assertThat(ExpenseCategory.fromValue("Vé tham quan")).isEqualTo(ExpenseCategory.TICKET);
        assertThat(ExpenseCategory.fromValue("Mua sắm")).isEqualTo(ExpenseCategory.SHOPPING);
        assertThat(ExpenseCategory.fromValue("Khác")).isEqualTo(ExpenseCategory.OTHER);
        assertThat(ExpenseCategory.fromValue("  ")).isNull();

        assertThatThrownBy(() -> ExpenseCategory.fromValue("UNKNOWN_CAT"))
                .isInstanceOf(IllegalArgumentException.class);

        ExpenseCategoryConverter converter = new ExpenseCategoryConverter();
        assertThat(converter.convertToDatabaseColumn(ExpenseCategory.TRANSPORT)).isEqualTo("TRANSPORT");
        assertThat(converter.convertToDatabaseColumn(null)).isEqualTo("OTHER");
        assertThat(converter.convertToEntityAttribute("Di chuyển")).isEqualTo(ExpenseCategory.TRANSPORT);
        assertThat(converter.convertToEntityAttribute("LEGACY_CUSTOM")).isEqualTo(ExpenseCategory.OTHER);
    }

    private ExpenseCategorySummaryProjection projection(
            ExpenseCategory category,
            String totalAmount,
            long count
    ) {
        return new ExpenseCategorySummaryProjection() {
            @Override
            public ExpenseCategory getCategory() {
                return category;
            }

            @Override
            public BigDecimal getTotalAmount() {
                return new BigDecimal(totalAmount);
            }

            @Override
            public Long getExpenseCount() {
                return count;
            }
        };
    }
}
