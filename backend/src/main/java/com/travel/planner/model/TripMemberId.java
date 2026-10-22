package com.travel.planner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

/**
 * Khóa chính kép (trip_id, user_id) của bảng 'trip_members'.
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripMemberId implements Serializable {

    @Column(name = "trip_id")
    private Long tripId;

    @Column(name = "user_id")
    private Long userId;
}
