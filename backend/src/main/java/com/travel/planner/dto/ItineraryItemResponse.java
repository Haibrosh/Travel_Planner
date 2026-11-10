package com.travel.planner.dto;

import com.travel.planner.model.ItineraryItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Chức năng: DTO trả thông tin chi tiết của một mục trong lịch trình (kèm thông tin địa điểm).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryItemResponse {

    private Long itemId;
    private Long tripId;
    private Integer dayNumber;
    private Double orderIndex;
    private LocalTime startTime;
    private LocalTime endTime;
    private PlaceDetailResponse place;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ItineraryItemResponse fromEntity(ItineraryItem item) {
        if (item == null) {
            return null;
        }
        return ItineraryItemResponse.builder()
                .itemId(item.getItemId())
                .tripId(item.getTrip() != null ? item.getTrip().getTripId() : null)
                .dayNumber(item.getDayNumber())
                .orderIndex(item.getPositionIndex())
                .startTime(item.getStartTime())
                .endTime(item.getEndTime())
                .place(PlaceDetailResponse.fromEntity(item.getPlace()))
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
