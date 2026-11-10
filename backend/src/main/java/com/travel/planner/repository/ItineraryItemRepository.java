package com.travel.planner.repository;

import com.travel.planner.model.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chức năng: Truy vấn và thao tác dữ liệu các địa điểm trong lịch trình chuyến đi (bảng app.itinerary_items).
 */
@Repository
public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {

    // Lấy tất cả địa điểm trong chuyến đi sắp xếp theo ngày và thứ tự vị trí
    List<ItineraryItem> findByTripTripIdOrderByDayNumberAscPositionIndexAsc(Long tripId);

    /**
     * Find itinerary items for a specific trip and day, ordered by position index (with Place fetched).
     */
    @Query("SELECT i FROM ItineraryItem i " +
           "JOIN FETCH i.place p " +
           "LEFT JOIN FETCH p.destination " +
           "WHERE i.trip.tripId = :tripId AND i.dayNumber = :dayNumber " +
           "ORDER BY i.positionIndex ASC")
    List<ItineraryItem> findByTripTripIdAndDayNumberOrderByPositionIndexAsc(
            @Param("tripId") Long tripId,
            @Param("dayNumber") Integer dayNumber
    );

    // Lấy tất cả địa điểm trong chuyến đi kèm thông tin Place chi tiết, sắp xếp theo ngày và thứ tự vị trí
    @Query("SELECT i FROM ItineraryItem i " +
           "JOIN FETCH i.place p " +
           "LEFT JOIN FETCH p.destination " +
           "WHERE i.trip.tripId = :tripId " +
           "ORDER BY i.dayNumber ASC NULLS LAST, i.positionIndex ASC")
    List<ItineraryItem> findAllByTripIdWithPlace(@Param("tripId") Long tripId);

    // Tìm giá trị position_index lớn nhất trong một ngày cụ thể của chuyến đi
    @Query("SELECT MAX(i.positionIndex) FROM ItineraryItem i " +
           "WHERE i.trip.tripId = :tripId AND i.dayNumber = :dayNumber")
    Optional<Double> findMaxPositionIndexByTripIdAndDayNumber(
            @Param("tripId") Long tripId,
            @Param("dayNumber") Integer dayNumber
    );

    // Tìm một mục lịch trình theo itemId và tripId kèm thông tin Place chi tiết
    @Query("SELECT i FROM ItineraryItem i " +
           "JOIN FETCH i.place p " +
           "LEFT JOIN FETCH p.destination " +
           "WHERE i.itemId = :itemId AND i.trip.tripId = :tripId")
    Optional<ItineraryItem> findByItemIdAndTripIdWithPlace(
            @Param("itemId") Long itemId,
            @Param("tripId") Long tripId
    );

    // Tìm một mục lịch trình theo itemId và tripId
    Optional<ItineraryItem> findByItemIdAndTrip_TripId(Long itemId, Long tripId);

    // Lấy tất cả địa điểm trong một ngày cụ thể của chuyến đi, sắp xếp theo positionIndex tăng dần
    List<ItineraryItem> findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(Long tripId, Integer dayNumber);

    // Chuyển các địa điểm có ngày vượt quá số ngày của chuyến đi về danh sách chưa xếp ngày (day_number = NULL)
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE ItineraryItem i SET i.dayNumber = NULL WHERE i.trip.tripId = :tripId AND i.dayNumber > :maxDays")
    int unassignItemsExceedingMaxDays(@Param("tripId") Long tripId, @Param("maxDays") Integer maxDays);
}
