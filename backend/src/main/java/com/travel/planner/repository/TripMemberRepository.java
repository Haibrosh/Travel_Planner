package com.travel.planner.repository;

import com.travel.planner.model.TripMember;
import com.travel.planner.model.TripMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Thao tác với bảng 'app.trip_members' (quản lý thành viên chuyến đi theo V6 của Tiên).
 */
@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, TripMemberId> {

    // Chèn bản ghi OWNER một cách an toàn khi chạy song song cho trip cũ (trước V6)
    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO app.trip_members (trip_id, user_id, role, status)
            VALUES (:tripId, :userId, 'OWNER', 'ACTIVE')
            ON CONFLICT (trip_id, user_id) DO NOTHING
            """, nativeQuery = true)
    void insertOwnerIfMissingIgnoreConflict(
            @Param("tripId") Long tripId,
            @Param("userId") Long userId
    );

    // Danh sách thành viên đang hoạt động trong chuyến đi
    List<TripMember> findByTrip_TripIdAndStatus(Long tripId, String status);

    // Danh sách thành viên theo trạng thái kèm User (tránh N+1 khi chia tiền)
    @Query("""
            SELECT m FROM TripMember m
            JOIN FETCH m.user
            WHERE m.trip.tripId = :tripId AND m.status = :status
            ORDER BY m.joinedAt ASC, m.user.userId ASC
            """)
    List<TripMember> findByTripIdAndStatusWithUser(
            @Param("tripId") Long tripId,
            @Param("status") String status
    );

    // Tìm thành viên cụ thể trong chuyến đi
    Optional<TripMember> findByTrip_TripIdAndUser_UserId(Long tripId, Long userId);

    // Tìm thành viên cụ thể kèm User (tránh Lazy loading)
    @Query("""
            SELECT m FROM TripMember m
            JOIN FETCH m.user
            WHERE m.trip.tripId = :tripId AND m.user.userId = :userId
            """)
    Optional<TripMember> findByTripIdAndUserIdWithUser(
            @Param("tripId") Long tripId,
            @Param("userId") Long userId
    );

    // Kiểm tra user có đang là thành viên ACTIVE trong chuyến đi không
    boolean existsByTrip_TripIdAndUser_UserIdAndStatus(Long tripId, Long userId, String status);
}
