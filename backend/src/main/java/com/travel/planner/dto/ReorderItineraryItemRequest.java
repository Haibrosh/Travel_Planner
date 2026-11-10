package com.travel.planner.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Chức năng: DTO nhận dữ liệu khi kéo thả thay đổi thứ tự địa điểm trong ngày.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderItineraryItemRequest {

    @Schema(description = "ID của địa điểm liền trước vị trí mới (null nếu kéo lên đầu danh sách)", example = "3")
    private Long prevItemId;

    @Schema(description = "ID của địa điểm liền sau vị trí mới (null nếu kéo xuống cuối danh sách)", example = "5")
    private Long nextItemId;

    @Schema(description = "Ngày lịch trình mới nếu kéo sang ngày khác (optional, mặc định giữ nguyên ngày hiện tại)", example = "1")
    private Integer targetDayNumber;

    @Schema(description = "Giá trị orderIndex mới nếu frontend trực tiếp tính toán (optional)", example = "1.5")
    private Double orderIndex;
}
