package com.travel.planner.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Chức năng: DTO nhận dữ liệu đầu vào khi thêm một địa điểm vào ngày trong lịch trình.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateItineraryItemRequest {

    @NotNull(message = "ID địa điểm (placeId) không được để trống")
    @Schema(description = "ID của địa điểm cần thêm vào lịch trình", example = "105")
    private Long placeId;

    @NotNull(message = "Ngày lịch trình (dayNumber) không được để trống")
    @Min(value = 1, message = "Ngày lịch trình (dayNumber) phải lớn hơn hoặc bằng 1")
    @Schema(description = "Số thứ tự ngày trong lịch trình (bắt đầu từ 1)", example = "1")
    private Integer dayNumber;

    @Schema(description = "Thời gian bắt đầu tham quan (HH:mm:ss hoặc HH:mm)", example = "09:00:00")
    private LocalTime startTime;

    @Schema(description = "Thời gian kết thúc tham quan (HH:mm:ss hoặc HH:mm)", example = "11:30:00")
    private LocalTime endTime;

    @Schema(description = "Ghi chú tham quan cho địa điểm trong lịch trình", example = "Mua vé online trước")
    private String note;
}
