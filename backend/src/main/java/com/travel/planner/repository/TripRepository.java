package com.travel.planner.repository;

import com.travel.planner.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Chức năng: Truy vấn bảng 'app.trips'.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    // Các trip do user làm chủ, mới nhất trước
    List<Trip> findByOwner_UserIdOrderByStartDateDesc(Long ownerId);

    // Lấy tất cả trip user có quyền truy cập (là owner HOẶC là member đang ACTIVE trong trip_members)
    @Query("""
            SELECT DISTINCT t FROM Trip t
            LEFT JOIN TripMember m ON m.trip = t
            WHERE t.owner.userId = :userId OR (m.user.userId = :userId AND m.status = 'ACTIVE')
            ORDER BY t.startDate DESC
            """)
    List<Trip> findAllAccessibleByUser(@Param("userId") Long userId);

    // Kiểm tra user có phải owner của trip không (dùng cho quyền xóa trip / đổi quyền)
    boolean existsByTripIdAndOwner_UserId(Long tripId, Long ownerId);
}
