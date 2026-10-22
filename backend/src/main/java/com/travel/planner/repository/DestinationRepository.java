package com.travel.planner.repository;

import com.travel.planner.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Chức năng: Giao tiếp với cơ sở dữ liệu cho bảng 'analytics.destinations', dùng để tra cứu điểm đến khi tạo/xem chuyến đi.
 */
@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
}
