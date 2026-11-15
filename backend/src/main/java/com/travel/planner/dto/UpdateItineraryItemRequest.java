package com.travel.planner.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Chức năng: DTO nhận dữ liệu đầu vào khi cập nhật thời gian của một mục trong lịch trình.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateItineraryItemRequest {

    @Schema(description = "Thời gian bắt đầu tham quan (HH:mm:ss hoặc HH:mm)", example = "09:00:00")
    private LocalTime startTime;

    @Schema(description = "Thời gian kết thúc tham quan (HH:mm:ss hoặc HH:mm)", example = "11:30:00")
    private LocalTime endTime;

    @Schema(description = "Ghi chú tham quan cho địa điểm trong lịch trình", example = "Mua vé online trước")
    private String note;

    @Schema(description = "ID của địa điểm liền trước (dùng khi kéo thả đổi vị trí)", example = "3")
    private Long prevItemId;

    @Schema(description = "ID của địa điểm liền sau (dùng khi kéo thả đổi vị trí)", example = "5")
    private Long nextItemId;

    @Schema(description = "Giá trị orderIndex trực tiếp nếu có (optional)", example = "1.5")
    private Double orderIndex;
}
