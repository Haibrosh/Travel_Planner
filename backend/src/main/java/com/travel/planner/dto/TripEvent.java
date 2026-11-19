package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO mô tả một sự kiện real-time được phát tới kênh WebSocket của chuyến đi.
 *
 * <p>Client nhận message này khi subscribe kênh {@code /topic/trips/{tripId}}.</p>
 *
 * <p>Ví dụ các event type:</p>
 * <ul>
 *   <li>{@code ITINERARY_ADDED} – thêm mới điểm đến vào lịch trình</li>
 *   <li>{@code ITINERARY_UPDATED} – cập nhật điểm trong lịch trình</li>
 *   <li>{@code ITINERARY_DELETED} – xóa điểm khỏi lịch trình</li>
 *   <li>{@code ITINERARY_REORDERED} – thay đổi thứ tự lịch trình</li>
 *   <li>{@code EXPENSE_ADDED} – thêm chi phí mới</li>
 *   <li>{@code EXPENSE_UPDATED} – cập nhật chi phí</li>
 *   <li>{@code EXPENSE_DELETED} – xóa chi phí</li>
 *   <li>{@code CHECKLIST_UPDATED} – cập nhật checklist</li>
 *   <li>{@code MEMBER_JOINED} – thành viên mới tham gia</li>
 *   <li>{@code MEMBER_LEFT} – thành viên rời chuyến đi</li>
 *   <li>{@code TRIP_UPDATED} – thông tin chuyến đi thay đổi</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripEvent {

    /**
     * Loại sự kiện (ví dụ: ITINERARY_ADDED, EXPENSE_DELETED, ...).
     */
    private String eventType;

    /**
     * ID chuyến đi mà sự kiện thuộc về.
     */
    private Long tripId;

    /**
     * Dữ liệu payload kèm theo (ví dụ: ItineraryItemResponse, ExpenseResponse, ...).
     * Client dựa vào {@code eventType} để deserialize đúng kiểu.
     */
    private Object payload;

    /**
     * Email / tên user thực hiện hành động gây ra sự kiện.
     */
    private String triggeredBy;

    /**
     * Thời điểm phát sự kiện (ISO-8601).
     */
    @Builder.Default
    private Instant timestamp = Instant.now();
}

