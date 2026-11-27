package com.travel.planner.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Chức năng: Chuyển đổi giữa enum ExpenseCategory trong Java và cột VARCHAR(50) trong bảng app.expenses.
 */
@Converter(autoApply = false)
public class ExpenseCategoryConverter implements AttributeConverter<ExpenseCategory, String> {

    @Override
    public String convertToDatabaseColumn(ExpenseCategory attribute) {
        return attribute != null ? attribute.name() : ExpenseCategory.OTHER.name();
    }

    @Override
    public ExpenseCategory convertToEntityAttribute(String dbData) {
        return ExpenseCategory.fromDatabaseValue(dbData);
    }
}
