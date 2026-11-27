package com.travel.planner.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/**
 * Chức năng: Danh mục chuẩn cho các khoản chi phí (expenses) của chuyến đi.
 * Hỗ trợ parse linh hoạt cả mã enum chuẩn lẫn nhãn tiếng Việt từ Frontend.
 */
@Getter
public enum ExpenseCategory {

    FOOD("Ăn uống", List.of("an uong", "dining", "eat", "meal")),
    TRANSPORT("Di chuyển", List.of("di chuyen", "travel", "move", "vehicle")),
    ACCOMMODATION("Khách sạn", List.of("khach san", "luu tru", "hotel", "lodging")),
    TICKET("Vé tham quan", List.of("ve tham quan", "tham quan", "sightseeing", "activities", "activity", "entertainment", "giai tri")),
    SHOPPING("Mua sắm", List.of("mua sam")),
    OTHER("Khác", List.of("khac"));

    private final String label;
    private final List<String> aliases;

    ExpenseCategory(String label, List<String> aliases) {
        this.label = label;
        this.aliases = aliases;
    }

    /**
     * Parse chuỗi đầu vào (từ JSON API) thành ExpenseCategory chuẩn; trả về null nếu chuỗi rỗng/null.
     */
    @JsonCreator
    public static ExpenseCategory fromValue(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }
        ExpenseCategory matched = resolveOrNull(raw);
        if (matched == null) {
            throw new IllegalArgumentException(
                    "Danh mục chi phí (category) không hợp lệ: '" + raw.trim()
                            + "'. Giá trị hợp lệ: FOOD, TRANSPORT, ACCOMMODATION, TICKET, SHOPPING, OTHER.");
        }
        return matched;
    }

    /**
     * Parse dữ liệu từ DB thành ExpenseCategory; fallback về OTHER nếu gặp giá trị cũ không chuẩn.
     */
    public static ExpenseCategory fromDatabaseValue(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return OTHER;
        }
        ExpenseCategory matched = resolveOrNull(raw);
        return matched != null ? matched : OTHER;
    }

    private static ExpenseCategory resolveOrNull(String raw) {
        String normalized = normalizeKey(raw);
        for (ExpenseCategory category : values()) {
            if (category.name().equalsIgnoreCase(raw.trim()) || normalizeKey(category.label).equals(normalized)) {
                return category;
            }
            if (category.aliases.contains(normalized)) {
                return category;
            }
        }
        return null;
    }

    private static String normalizeKey(String input) {
        String decomposed = Normalizer.normalize(input.trim(), Normalizer.Form.NFD);
        return decomposed
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
    }
}
