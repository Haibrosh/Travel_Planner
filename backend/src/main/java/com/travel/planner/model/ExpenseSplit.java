package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Chức năng: Entity ánh xạ vào bảng 'expense_splits' trong schema 'app'.
 * Chi tiết số tiền mỗi thành viên phải chịu cho một khoản chi.
 */
@Entity
@Table(name = "expense_splits", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "split_id")
    private Long splitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    // Phải trùng với trip của expense (DB ràng buộc bằng FK kép)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "split_amount", nullable = false, precision = 15, scale = 0)
    private BigDecimal splitAmount;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
