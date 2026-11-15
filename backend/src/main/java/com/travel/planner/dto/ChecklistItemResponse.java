package com.travel.planner.dto;

import com.travel.planner.model.ChecklistItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Chức năng: DTO trả thông tin một món đồ hành lý (ChecklistItem) về cho Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemResponse {

    private Long itemId;
    private Long tripId;
    private String name;
    private String category;
    private Boolean isCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ChecklistItemResponse fromEntity(ChecklistItem item) {
        if (item == null) {
            return null;
        }
        return ChecklistItemResponse.builder()
                .itemId(item.getItemId())
                .tripId(item.getTrip() != null ? item.getTrip().getTripId() : null)
                .name(item.getName())
                .category(item.getCategory())
                .isCompleted(item.getIsCompleted())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
