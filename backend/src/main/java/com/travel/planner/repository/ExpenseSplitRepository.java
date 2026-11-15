package com.travel.planner.repository;

import com.travel.planner.model.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Chức năng: Truy vấn và thao tác bảng 'app.expense_splits' (chi tiết chia tiền theo thành viên).
 */
@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    // Lấy toàn bộ bản ghi chia tiền của một chuyến đi kèm thông tin thành viên
    @Query("""
            SELECT s FROM ExpenseSplit s
            JOIN FETCH s.user
            WHERE s.trip.tripId = :tripId
            ORDER BY s.expense.expenseId DESC, s.splitId ASC
            """)
    List<ExpenseSplit> findAllByTripIdWithUser(@Param("tripId") Long tripId);

    // Lấy chi tiết chia tiền của một khoản chi kèm thông tin thành viên
    @Query("""
            SELECT s FROM ExpenseSplit s
            JOIN FETCH s.user
            WHERE s.expense.expenseId = :expenseId
            ORDER BY s.splitId ASC
            """)
    List<ExpenseSplit> findAllByExpenseIdWithUser(@Param("expenseId") Long expenseId);

    // Xóa toàn bộ dòng chia tiền cũ của một khoản chi (flush trước khi insert lại để tránh trùng UNIQUE constraint)
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM ExpenseSplit s WHERE s.expense.expenseId = :expenseId")
    void deleteAllByExpenseId(@Param("expenseId") Long expenseId);
}
