package com.travel.planner.repository;

import com.travel.planner.model.TripMember;
import com.travel.planner.model.TripMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Thao tác với bảng 'app.trip_members' (quản lý thành viên chuyến đi theo V6 của Tiên).
 */
@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, TripMemberId> {

    // Danh sách thành viên đang hoạt động trong chuyến đi
    List<TripMember> findByTrip_TripIdAndStatus(Long tripId, String status);

    // Tìm thành viên cụ thể trong chuyến đi
    Optional<TripMember> findByTrip_TripIdAndUser_UserId(Long tripId, Long userId);

    // Kiểm tra user có đang là thành viên ACTIVE trong chuyến đi không
    boolean existsByTrip_TripIdAndUser_UserIdAndStatus(Long tripId, Long userId, String status);
}
