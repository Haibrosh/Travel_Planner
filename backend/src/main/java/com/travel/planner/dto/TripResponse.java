package com.travel.planner.dto;

import com.travel.planner.model.Trip;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Chức năng: DTO trả thông tin chi tiết của chuyến đi về cho Client (ẩn thông tin nhạy cảm như mật khẩu của Owner).
 */
@Data
@Builder
public class TripResponse {

    private Long tripId;
    private Long ownerId;
    private String ownerUsername;
    private String provinceCode;
    private String destinationName;
    private String destinationSlug;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Hàm đặc biệt: Chuyển đổi từ Entity Trip sang DTO TripResponse để trả về JSON chuẩn cho Frontend
    public static TripResponse fromEntity(Trip trip) {
        String provinceCode = trip.getDestination() != null ? trip.getDestination().getProvinceCode() : null;
        String destName = trip.getDestination() != null ? trip.getDestination().getName() : null;
        String destSlug = trip.getDestination() != null ? trip.getDestination().getSlug() : null;

        return TripResponse.builder()
                .tripId(trip.getTripId())
                .ownerId(trip.getOwner().getUserId())
                .ownerUsername(trip.getOwner().getUsername())
                .provinceCode(provinceCode)
                .destinationName(destName)
                .destinationSlug(destSlug)
                .name(trip.getName())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .status(trip.getStatus())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();
    }
}
