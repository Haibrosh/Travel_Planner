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
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 20)
    private String role; // ROLE_USER, ROLE_ADMIN

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // JPA tự động kích hoạt để gán thời gian tạo bản ghi
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
