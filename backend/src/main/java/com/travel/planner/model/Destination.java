package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

/**
 * Chức năng: Entity chỉ đọc ánh xạ bảng 'analytics.destinations_v2' - danh sách 34 tỉnh/thành hiện hành.
 * @Immutable: Hibernate không bao giờ UPDATE bảng này.
 */
@Entity
@Table(name = "destinations_v2", schema = "analytics")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Immutable
public class Destination {

    @Id
    @Column(name = "province_code", length = 2)
    private String provinceCode;

    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "name_en", length = 255)
    private String nameEn;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "area_km2")
    private Double areaKm2;

    @Column(name = "source_version", length = 200)
    private String sourceVersion;
}
