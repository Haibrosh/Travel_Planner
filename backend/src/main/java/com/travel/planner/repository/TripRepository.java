package com.travel.planner.repository;

import com.travel.planner.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Truy vấn bảng 'app.trips'.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    // Các trip do user làm chủ, mới nhất trước
    List<Trip> findByOwner_UserIdOrderByStartDateDesc(Long ownerId);

    // Hàm đặc biệt: Lấy danh sách trip của chủ sở hữu kèm luôn thông tin Owner (tránh lỗi Lazy Loading & N+1 query)
    @Query("""
            SELECT t FROM Trip t
            JOIN FETCH t.owner
            WHERE t.owner.userId = :ownerId
            ORDER BY t.createdAt DESC
            """)
    List<Trip> findAllByOwnerIdWithDetails(@Param("ownerId") Long ownerId);

    // Hàm đặc biệt: Lấy chi tiết 1 trip theo ID kèm thông tin Owner
    @Query("""
            SELECT t FROM Trip t
            JOIN FETCH t.owner
            WHERE t.tripId = :tripId
            """)
    Optional<Trip> findByIdWithDetails(@Param("tripId") Long tripId);

    // Hàm đặc biệt: Kiểm tra destination_id có tồn tại trong bảng analytics.destinations không
    // (cột app.trips.destination_id là FK BIGINT trỏ tới bảng này - chỉ đọc, không sửa DB)
    @Query(value = "SELECT EXISTS (SELECT 1 FROM analytics.destinations WHERE destination_id = :destinationId)",
            nativeQuery = true)
    boolean existsDestinationById(@Param("destinationId") Long destinationId);

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
