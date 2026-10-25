'use client';

import { useState } from 'react';
import type { TripResponse } from '@/types/trip';

interface BudgetTabProps {
  trip: TripResponse;
}

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  paidBy: string;
  date: string;
}

export default function BudgetTab({ trip }: BudgetTabProps) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: '1',
      title: 'Đặt phòng homestay 3 ngày 2 đêm',
      category: 'Lưu trú',
      amount: 1800000,
      paidBy: trip.ownerUsername,
      date: trip.startDate,
    },
    {
      id: '2',
      title: 'Vé xe khứ hồi Limousine',
      category: 'Di chuyển',
      amount: 700000,
      paidBy: trip.ownerUsername,
      date: trip.startDate,
    },
  ]);

  const [totalBudget] = useState<number>(5000000);
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalBudget - totalSpent;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8 space-y-8">
      {/* KPI Cards: Rules: clean typography, 1px rules, no icons in colored circles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Dự toán chuyến đi</span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVND(totalBudget)}
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Ngân sách dự kiến</span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Đã chi tiêu</span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVND(totalSpent)}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            {Math.round((totalSpent / totalBudget) * 100)}% ngân sách
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Số dư còn lại</span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVND(remaining)}
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Khả dụng</span>
        </div>
      </div>

      {/* Expense Management Shell */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Danh sách khoản chi
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Theo dõi và phân chia chi phí với thành viên</p>
          </div>

          <button
            onClick={() => {
              const title = prompt('Nhập tên khoản chi mới:');
              const amountStr = prompt('Nhập số tiền (VND):');
              if (title && amountStr && !isNaN(Number(amountStr))) {
                setExpenses([
                  ...expenses,
                  {
                    id: String(Date.now()),
                    title,
                    category: 'Ăn uống',
                    amount: Number(amountStr),
                    paidBy: trip.ownerUsername,
                    date: new Date().toISOString().split('T')[0],
                  },
                ]);
              }
            }}
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Thêm khoản chi
          </button>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {expenses.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{item.category}</span>
                  <span>• Người trả: {item.paidBy}</span>
                  <span>• {item.date}</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formatVND(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
