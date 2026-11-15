package com.travel.planner.dto;

import com.travel.planner.model.ExpenseSplit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Chức năng: DTO trả thông tin chi tiết phần tiền mỗi thành viên phải chịu cho một khoản chi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSplitResponse {

    private Long splitId;
    private Long userId;
    private String username;
    private String avatarUrl;
    private BigDecimal splitAmount;

    public static ExpenseSplitResponse fromEntity(ExpenseSplit split) {
        if (split == null) {
            return null;
        }
        return ExpenseSplitResponse.builder()
                .splitId(split.getSplitId())
                .userId(split.getUser() != null ? split.getUser().getUserId() : null)
                .username(split.getUser() != null ? split.getUser().getUsername() : null)
                .avatarUrl(split.getUser() != null ? split.getUser().getAvatarUrl() : null)
                .splitAmount(split.getSplitAmount())
                .build();
    }
}
