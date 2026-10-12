package com.travel.planner.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "itinerary_items", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItineraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    // NULL nếu nằm trong Pool chưa xếp ngày. Lớn hơn 0 nếu thuộc ngày trong lịch trình.
    @Column(name = "day_number")
    private Integer dayNumber;

    @Column(name = "position_index", nullable = false)
    private Double positionIndex;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

}
