package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_members", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripMember {

    @EmbeddedId
    private TripMemberId id;

    @MapsId("tripId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // OWNER, COLLABORATOR
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private String role = "COLLABORATOR";

    // ACTIVE, LEFT
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "joined_at", insertable = false, updatable = false)
    private LocalDateTime joinedAt;
}
