package com.travel.planner.repository;

import com.travel.planner.model.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Truy vấn và thao tác bảng 'app.checklist_items' (danh sách hành lý của chuyến đi).
 */
@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

    // Lấy toàn bộ danh sách hành lý của chuyến đi theo thứ tự tạo tăng dần
    List<ChecklistItem> findByTrip_TripIdOrderByItemIdAsc(Long tripId);

    // Tìm một món đồ theo itemId và tripId để đảm bảo thuộc đúng chuyến đi
    Optional<ChecklistItem> findByItemIdAndTrip_TripId(Long itemId, Long tripId);
}
