package com.travel.planner.service;

import com.travel.planner.dto.TripEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service phát sự kiện real-time tới tất cả client đang subscribe kênh
 * {@code /topic/trips/{tripId}} thông qua WebSocket (STOMP).
 *
 * <p>Cách dùng trong các service khác:</p>
 * <pre>{@code
 *   // Sau khi thêm item vào lịch trình:
 *   tripEventPublisher.publish(tripId, "ITINERARY_ADDED", savedItemResponse, currentUserEmail);
 *
 *   // Sau khi xóa chi phí:
 *   tripEventPublisher.publish(tripId, "EXPENSE_DELETED", expenseId, currentUserEmail);
 * }</pre>
 *
 * <p>Client nhận được {@link TripEvent} với đầy đủ thông tin: loại sự kiện, tripId,
 * payload chi tiết, ai thực hiện, và timestamp.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TripEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Destination prefix cho kênh trip.
     * Message sẽ được gửi tới: /topic/trips/{tripId}
     */
    private static final String TRIP_TOPIC_PREFIX = "/topic/trips/";

    /**
     * Phát một sự kiện tới tất cả thành viên đang mở (subscribe) chuyến đi.
     *
     * @param tripId      ID chuyến đi
     * @param eventType   loại sự kiện (ITINERARY_ADDED, EXPENSE_DELETED, ...)
     * @param payload     dữ liệu kèm theo (DTO response hoặc ID)
     * @param triggeredBy email/tên người gây ra sự kiện
     */
    public void publish(Long tripId, String eventType, Object payload, String triggeredBy) {
        TripEvent event = TripEvent.builder()
                .eventType(eventType)
                .tripId(tripId)
                .payload(payload)
                .triggeredBy(triggeredBy)
                .timestamp(Instant.now())
                .build();

        String destination = TRIP_TOPIC_PREFIX + tripId;
        messagingTemplate.convertAndSend(destination, event);

        log.info("Đã phát sự kiện [{}] tới {} bởi '{}'", eventType, destination, triggeredBy);
    }

    /**
     * Phát sự kiện tới một sub-channel cụ thể trong trip.
     * Ví dụ: /topic/trips/{tripId}/expenses, /topic/trips/{tripId}/itinerary
     *
     * @param tripId      ID chuyến đi
     * @param subChannel  tên sub-channel (ví dụ: "expenses", "itinerary", "checklist")
     * @param eventType   loại sự kiện
     * @param payload     dữ liệu kèm theo
     * @param triggeredBy email/tên người gây ra sự kiện
     */
    public void publishToSubChannel(Long tripId, String subChannel,
                                     String eventType, Object payload, String triggeredBy) {
        TripEvent event = TripEvent.builder()
                .eventType(eventType)
                .tripId(tripId)
                .payload(payload)
                .triggeredBy(triggeredBy)
                .timestamp(Instant.now())
                .build();

        String destination = TRIP_TOPIC_PREFIX + tripId + "/" + subChannel;
        messagingTemplate.convertAndSend(destination, event);

        log.info("Đã phát sự kiện [{}] tới {} bởi '{}'", eventType, destination, triggeredBy);
    }
}

