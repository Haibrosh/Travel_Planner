'use client';

import React from 'react';
import { GroupFundCard } from '@/components/cards/GroupFundCard';
import { TotalExpenseCard, ExpenseItem } from '@/components/cards/TotalExpenseCard';

export interface TripBudgetPanelProps {
  fundBalance: number;
  expenses: ExpenseItem[];
  onUpdateBalance: (newBalance: number) => void;
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onDeleteExpense: (id: string | number) => void;
}

export const TripBudgetPanel: React.FC<TripBudgetPanelProps> = ({
  fundBalance,
  expenses,
  onUpdateBalance,
  onAddExpense,
  onDeleteExpense,
}) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-8">
      <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
        CHI TIÊU
      </h2>

      {/* Thẻ Quỹ nhóm nhận dữ liệu từ props */}
      <GroupFundCard
        initialBalance={fundBalance}
        onSaveBalance={onUpdateBalance}
      />

      {/* Thẻ Tổng khoản chi nhận danh sách và hàm xử lý từ props */}
      <TotalExpenseCard
        expenses={expenses}
        onAddExpense={onAddExpense}
        onDeleteExpense={onDeleteExpense}
      />
    </div>
  );
};