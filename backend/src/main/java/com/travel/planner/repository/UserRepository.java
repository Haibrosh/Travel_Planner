package com.travel.planner.repository;

import com.travel.planner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Thao tác với bảng 'users' trong DB.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Spring Data JPA tự động sinh query tìm User bằng email
    Optional<User> findByEmail(String email);

    // Kiểm tra xem email đã tồn tại hay chưa
    boolean existsByEmail(String email);
}
