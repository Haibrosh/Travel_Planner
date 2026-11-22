'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ExpenseItem } from '@/components/cards/TotalExpenseCard';

export type ExpenseCategory = 'Ăn uống' | 'Di chuyển' | 'Vé tham quan' | 'Khách sạn';

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  defaultPaidBy?: string;
}

const CATEGORIES: ExpenseCategory[] = [
  'Ăn uống',
  'Di chuyển',
  'Vé tham quan',
  'Khách sạn',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  defaultPaidBy = 'Trưởng nhóm',
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Ăn uống');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(defaultPaidBy);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim() || !numericAmount || numericAmount <= 0) return;

    onAddExpense({
      title: title.trim(),
      category,
      amount: numericAmount,
      paidBy: paidBy.trim() || 'Thành viên',
    });

    setTitle('');
    setAmount('');
    setCategory('Ăn uống');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0F172A]">Thêm khoản chi</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Tên khoản chi</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ăn trưa, Vé tham quan, Đặt phòng..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Số tiền (VND)</label>
              <input
                type="number"
                min={1000}
                step={1000}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="200000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 tabular-nums focus:border-teal-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Người chi</label>
            <input
              type="text"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              placeholder="Trưởng nhóm"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};