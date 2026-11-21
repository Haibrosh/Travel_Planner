'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Wallet,
  Utensils,
  Car,
  Ticket,
  Hotel,
} from 'lucide-react';
import type { ExpenseItem } from '@/components/cards/TotalExpenseCard';
import {
  AddExpenseModal,
  type ExpenseCategory,
} from '@/components/modals/AddExpenseModal';

export interface TripBudgetPanelProps {
  fundBalance?: number;
  expenses?: ExpenseItem[];
  defaultPaidBy?: string;
  onUpdateBalance?: (newBalance: number) => void;
  onAddExpense?: (expense: Omit<ExpenseItem, 'id'>) => void;
  onDeleteExpense?: (id: string | number) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Ăn uống',
  'Di chuyển',
  'Vé tham quan',
  'Khách sạn',
];

const CATEGORY_META: Record<
  ExpenseCategory,
  { badge: string; bar: string; icon: React.ReactNode }
> = {
  'Ăn uống': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
    icon: <Utensils className="w-3.5 h-3.5" />,
  },
  'Di chuyển': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    bar: 'bg-sky-500',
    icon: <Car className="w-3.5 h-3.5" />,
  },
  'Vé tham quan': {
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    bar: 'bg-teal-600',
    icon: <Ticket className="w-3.5 h-3.5" />,
  },
  'Khách sạn': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bar: 'bg-indigo-500',
    icon: <Hotel className="w-3.5 h-3.5" />,
  },
};

const normalizeCategory = (raw?: string): ExpenseCategory => {
  if (
    raw === 'Ăn uống' ||
    raw === 'Di chuyển' ||
    raw === 'Vé tham quan' ||
    raw === 'Khách sạn'
  ) {
    return raw;
  }
  return 'Ăn uống';
};

export const TripBudgetPanel: React.FC<TripBudgetPanelProps> = ({
  fundBalance,
  expenses,
  defaultPaidBy,
  onUpdateBalance,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [internalBudget, setInternalBudget] = useState<number>(fundBalance ?? 10000000);
  const [internalExpenses, setInternalExpenses] = useState<ExpenseItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'Tất cả' | ExpenseCategory>('Tất cả');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const budgetAmount =
    onUpdateBalance && fundBalance !== undefined ? fundBalance : internalBudget;
  const activeExpenses = expenses ?? internalExpenses;

  const totalSpent = useMemo(
    () => activeExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [activeExpenses]
  );

  const remaining = budgetAmount - totalSpent;
  const spentPercent =
    budgetAmount > 0 ? Math.min(100, Math.round((totalSpent / budgetAmount) * 100)) : 0;

  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      'Ăn uống': 0,
      'Di chuyển': 0,
      'Vé tham quan': 0,
      'Khách sạn': 0,
    };
    for (const item of activeExpenses) {
      const cat = normalizeCategory(item.category);
      totals[cat] += Number(item.amount) || 0;
    }
    return totals;
  }, [activeExpenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'Tất cả') return activeExpenses;
    return activeExpenses.filter(
      (item) => normalizeCategory(item.category) === selectedCategory
    );
  }, [activeExpenses, selectedCategory]);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleBudgetChange = (nextVal: number) => {
    const safeVal = Math.max(0, nextVal);
    if (onUpdateBalance) {
      onUpdateBalance(safeVal);
    } else {
      setInternalBudget(safeVal);
    }
  };

  const handleCreateExpense = (newExpensePayload: Omit<ExpenseItem, 'id'>) => {
    if (onAddExpense) {
      onAddExpense(newExpensePayload);
    } else {
      setInternalExpenses((prev) => [{ id: Date.now(), ...newExpensePayload }, ...prev]);
    }
  };

  const handleRemoveExpense = (id: string | number) => {
    if (onDeleteExpense) {
      onDeleteExpense(id);
    } else {
      setInternalExpenses((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-200 pb-8">
      {/* 1. Khung tổng ngân sách dự kiến & thanh tiến độ chi tiêu */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                CHI PHÍ
              </h2>
              <p className="text-xs text-slate-500">
                Tổng ngân sách dự kiến & tiến độ chi tiêu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khoản chi</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <span className="text-[11px] font-bold text-slate-500">Tổng ngân sách dự kiến</span>
            <p className="mt-1 text-base font-extrabold text-slate-900 tabular-nums">
              {formatVND(budgetAmount)}
            </p>
            <input
              type="number"
              min={0}
              step={100000}
              value={budgetAmount}
              onChange={(e) => handleBudgetChange(Number(e.target.value) || 0)}
              aria-label="Ngân sách dự kiến"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 tabular-nums focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <span className="text-[11px] font-bold text-slate-500">Đã chi tiêu</span>
            <p className="mt-1 text-base font-extrabold text-teal-700 tabular-nums">
              {formatVND(totalSpent)}
            </p>
            <span className="mt-2 inline-block text-[11px] font-semibold text-slate-500 tabular-nums">
              {spentPercent}% ngân sách
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <span className="text-[11px] font-bold text-slate-500">Còn lại</span>
            <p
              className={`mt-1 text-base font-extrabold tabular-nums ${
                remaining < 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {formatVND(remaining)}
            </p>
            <span className="mt-2 inline-block text-[11px] font-semibold text-slate-500">
              {remaining < 0 ? 'Vượt ngân sách' : 'Trong hạn mức'}
            </span>
          </div>
        </div>

        {/* Thanh tiến độ chi tiêu */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Thanh tiến độ chi tiêu</span>
            <span className="text-teal-700 tabular-nums">{spentPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-300 ${
                remaining < 0 ? 'bg-rose-500' : 'bg-teal-600'
              }`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Biểu đồ chi tiêu theo danh mục */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Biểu đồ chi tiêu theo danh mục
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const catTotal = categoryTotals[cat];
            const ratio = totalSpent > 0 ? Math.round((catTotal / totalSpent) * 100) : 0;
            return (
              <div
                key={cat}
                className="rounded-xl border border-slate-200/70 p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                    {CATEGORY_META[cat].icon}
                    {cat}
                  </span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatVND(catTotal)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${CATEGORY_META[cat].bar} transition-all duration-300`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">{ratio}% tổng chi</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Danh sách các khoản chi theo danh mục */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="border-b border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900">
            Danh sách khoản chi ({filteredExpenses.length})
          </h3>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['Tất cả', ...CATEGORIES] as const).map((tabCat) => {
              const isActive = selectedCategory === tabCat;
              return (
                <button
                  key={tabCat}
                  type="button"
                  onClick={() => setSelectedCategory(tabCat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tabCat}
                </button>
              );
            })}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Chưa có khoản chi nào trong danh mục này.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((item) => {
              const cat = normalizeCategory(item.category);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold ${CATEGORY_META[cat].badge}`}
                      >
                        {cat}
                      </span>
                      {item.paidBy && <span>• {item.paidBy}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                      {formatVND(Number(item.amount) || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(item.id)}
                      title="Xóa khoản chi"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal thêm khoản chi (tách file riêng) */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddExpense={handleCreateExpense}
        defaultPaidBy={defaultPaidBy}
      />
    </div>
  );
};