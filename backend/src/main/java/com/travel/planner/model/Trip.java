package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Chức năng: Entity ánh xạ bảng 'app.trips' (migration V3) - chuyến đi do một user tạo (owner).
 * Lưu ý: dùng @Getter/@Setter thay vì @Data để tránh toString/hashCode kéo theo quan hệ LAZY
 * (gây LazyInitializationException hoặc vòng lặp vô hạn).
 */
@Entity
@Table(name = "trips", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"owner"})
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trip_id")
    private Long tripId;

    // Chủ chuyến đi: có toàn quyền (xóa trip, mời collaborator)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // ID Điểm đến (khóa ngoại trỏ sang analytics.destinations(destination_id) kiểu BIGINT)
    @Column(name = "destination_id", nullable = false)
    private Long destinationId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // Trạng thái chuyến đi, khớp CHECK constraint trong DB (V6): 'PLANNING' hoặc 'COMPLETED'
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "PLANNING";

    // Do DB tự sinh (DEFAULT NOW() + trigger) nên không cho Hibernate ghi
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
