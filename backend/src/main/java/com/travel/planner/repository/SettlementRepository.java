package com.travel.planner.repository;

import com.travel.planner.model.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Truy vấn và thao tác bảng 'app.settlements' (lịch sử thanh toán/trả nợ giữa các thành viên).
 */
@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    // Lấy lịch sử thanh toán công nợ của một chuyến đi kèm thông tin người trả và người nhận
    @Query("""
            SELECT s FROM Settlement s
            JOIN FETCH s.fromUser
            JOIN FETCH s.toUser
            WHERE s.trip.tripId = :tripId
            ORDER BY s.settledAt DESC, s.settlementId DESC
            """)
    List<Settlement> findAllByTripIdWithUsers(@Param("tripId") Long tripId);

    // Tìm giao dịch thanh toán theo settlementId và tripId
    Optional<Settlement> findBySettlementIdAndTrip_TripId(Long settlementId, Long tripId);
}
