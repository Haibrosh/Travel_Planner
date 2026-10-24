'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, User } from 'lucide-react';

export interface ExpenseItem {
  id: string | number;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
}

export interface TotalExpenseCardProps {
  expenses: ExpenseItem[]; // Bắt buộc nhận từ props do page.tsx truyền vào
  onAddExpense?: (expense: Omit<ExpenseItem, 'id'>) => void;
  onDeleteExpense?: (id: string | number) => void;
}

export const TotalExpenseCard: React.FC<TotalExpenseCardProps> = ({
  expenses = [], // Fallback về mảng rỗng, không gán cứng dữ liệu mẫu bên trong
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const total = expenses.reduce((acc, item) => acc + item.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    onAddExpense?.({
      title,
      amount: Number(amount.replace(/\D/g, '')),
      category: 'Khác',
      paidBy: paidBy.trim() || 'Thành viên',
    });
    setTitle('');
    setAmount('');
    setPaidBy('');
    setShowAddForm(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      
      {/* Thanh tiêu đề chính */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-[#0F172A] tracking-wide">
            TỔNG KHOẢN CHI:
          </span>
          <span className="text-sm font-extrabold text-teal-700">
            {total.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600">
            {expenses.length} khoản chi
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-teal-50 flex items-center justify-center text-slate-500 group-hover:text-teal-600 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
          </div>
        </div>
      </div>

      {/* Phần Dropdown danh sách chi tiết */}
      {isOpen && (
        <div className="px-6 pb-5 pt-1 border-t border-slate-100 flex flex-col gap-3 animate-in fade-in duration-200">
          
          <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            {expenses.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400 font-medium">
                Chưa có khoản chi nào.
              </p>
            ) : (
              expenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs font-bold"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-800 font-extrabold">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> {item.paidBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-teal-700 font-extrabold text-sm">
                      {item.amount.toLocaleString('vi-VN')} đ
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteExpense?.(item.id);
                      }}
                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Xóa khoản chi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Nút hoặc Form Thêm khoản chi */}
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 bg-white border border-dashed border-teal-300 hover:border-teal-500 rounded-xl text-teal-700 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm khoản chi</span>
            </button>
          ) : (
            <form onSubmit={handleAdd} className="flex flex-col gap-2.5 p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 mt-1">
              <input
                type="text"
                placeholder="Tên khoản chi (VD: Cà phê sáng...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Số tiền (đ)"
                  value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
                />
                <input
                  type="text"
                  placeholder="Người chi (VD: Viễn)"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
};