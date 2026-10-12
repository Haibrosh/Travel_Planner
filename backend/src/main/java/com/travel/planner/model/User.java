package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Chức năng: Entity ánh xạ vào bảng 'users' trong schema 'app'.
 * Quản lý thông tin tài khoản người dùng đăng nhập hệ thống.
 */
@Entity
@Table(name = "users", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    // Tạm thời comment ẩn role theo yêu cầu, sau này cần phân quyền ADMIN thì mở lại
    // @Column(name = "role", nullable = false, length = 20)
    // @Builder.Default
    // private String role = "ROLE_USER";

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
