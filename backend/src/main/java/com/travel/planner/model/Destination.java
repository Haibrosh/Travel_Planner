package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

/**
 * Chức năng: Entity chỉ đọc ánh xạ bảng 'analytics.destinations' (migration V2) - danh sách điểm đến do pipeline nạp.
 * @Immutable: Hibernate không bao giờ UPDATE bảng này.
 */
@Entity
@Table(name = "destinations", schema = "analytics")
@Getter
@NoArgsConstructor
@Immutable
public class Destination {

    @Id
    @Column(name = "destination_id")
    private Long destinationId;

    @Column(name = "slug")
    private String slug;

    @Column(name = "name")
    private String name;
}
