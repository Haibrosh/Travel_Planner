package com.travel.planner.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Chức năng: DTO nhận từng mục địa điểm trong API cập nhật thứ tự hàng loạt (PUT /api/v1/trips/{tripId}/itinerary/reorder).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderItemRequest {

    @NotNull(message = "ID mục lịch trình (itemId) không được để trống")
    @Schema(description = "ID của mục lịch trình cần cập nhật vị trí", example = "12")
    private Long itemId;

    @JsonAlias({"targetDayNumber"})
    @Schema(description = "Số ngày trong lịch trình (null nếu chuyển về danh sách chưa xếp ngày, >= 1 nếu thuộc một ngày)", example = "2")
    private Integer dayNumber;

    @NotNull(message = "Thứ tự vị trí (orderIndex) không được để trống")
    @JsonAlias({"positionIndex"})
    @Schema(description = "Thứ tự vị trí mới của địa điểm trong ngày", example = "1.0")
    private Double orderIndex;
}
