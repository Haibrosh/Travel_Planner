package com.travel.planner.repository;

import com.travel.planner.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Truy vấn và thao tác bảng 'app.expenses' (các khoản chi của chuyến đi).
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Lấy danh sách khoản chi của chuyến đi kèm thông tin người trả (tránh N+1 query)
    @Query("""
            SELECT e FROM Expense e
            JOIN FETCH e.paidBy
            WHERE e.trip.tripId = :tripId
            ORDER BY e.expenseDate DESC, e.expenseId DESC
            """)
    List<Expense> findAllByTripIdWithPayer(@Param("tripId") Long tripId);

    // Tìm chi tiết 1 khoản chi thuộc đúng chuyến đi kèm thông tin người trả
    @Query("""
            SELECT e FROM Expense e
            JOIN FETCH e.paidBy
            WHERE e.expenseId = :expenseId AND e.trip.tripId = :tripId
            """)
    Optional<Expense> findByExpenseIdAndTripIdWithPayer(
            @Param("expenseId") Long expenseId,
            @Param("tripId") Long tripId
    );
}
