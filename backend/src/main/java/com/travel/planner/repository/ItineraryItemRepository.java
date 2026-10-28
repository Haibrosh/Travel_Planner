package com.travel.planner.repository;

import com.travel.planner.model.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Chức năng: Truy vấn và thao tác dữ liệu các địa điểm trong lịch trình chuyến đi (bảng app.itinerary_items).
 */
@Repository
public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {

    // Lấy tất cả địa điểm trong chuyến đi sắp xếp theo ngày và thứ tự vị trí
    List<ItineraryItem> findByTripTripIdOrderByDayNumberAscPositionIndexAsc(Long tripId);

    // Chuyển các địa điểm có ngày vượt quá số ngày của chuyến đi về danh sách chưa xếp ngày (day_number = NULL)
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE ItineraryItem i SET i.dayNumber = NULL WHERE i.trip.tripId = :tripId AND i.dayNumber > :maxDays")
    int unassignItemsExceedingMaxDays(@Param("tripId") Long tripId, @Param("maxDays") Integer maxDays);
}
