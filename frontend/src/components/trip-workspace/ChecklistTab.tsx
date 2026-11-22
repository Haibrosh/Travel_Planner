'use client';

import React, { useMemo, useState } from 'react';
import { Check, CheckSquare, Plus, Trash2 } from 'lucide-react';

export interface ChecklistItem {
  id: string | number;
  name: string;
  checked: boolean;
}

export interface ChecklistTabProps {
  items?: ChecklistItem[];
  isLoading?: boolean;
  onToggleItem?: (id: string | number, nextChecked: boolean) => void;
  onAddItem?: (name: string) => void;
  onDeleteItem?: (id: string | number) => void;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 1, name: 'CCCD / Giấy tờ tùy thân', checked: true },
  { id: 2, name: 'Sạc điện thoại & Pin dự phòng', checked: true },
  { id: 3, name: 'Áo khoác & Trang phục phù hợp thời tiết', checked: false },
  { id: 4, name: 'Kem chống nắng & Đồ dùng cá nhân', checked: false },
];

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  items,
  isLoading = false,
  onToggleItem,
  onAddItem,
  onDeleteItem,
}) => {
  const [internalItems, setInternalItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [newName, setNewName] = useState('');

  const displayItems = items ?? internalItems;

  const checkedCount = useMemo(
    () => displayItems.filter((item) => item.checked).length,
    [displayItems]
  );
  const totalCount = displayItems.length;
  const progressPercent =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const handleToggle = (item: ChecklistItem) => {
    const nextChecked = !item.checked;
    if (onToggleItem) {
      onToggleItem(item.id, nextChecked);
    } else {
      setInternalItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, checked: nextChecked } : row
        )
      );
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (onAddItem) {
      onAddItem(trimmed);
    } else {
      setInternalItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: trimmed,
          checked: false,
        },
      ]);
    }
    setNewName('');
  };

  const handleDelete = (id: string | number) => {
    if (onDeleteItem) {
      onDeleteItem(id);
    } else {
      setInternalItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-200 pb-8">
      {/* Thanh tiến độ X/Y món đồ đã chuẩn bị & ô nhập thêm nhanh */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
              HÀNH LÝ
            </h2>
            <p className="text-xs font-semibold text-slate-500 tabular-nums">
              Đã chuẩn bị{' '}
              <span className="font-extrabold text-teal-700">
                {checkedCount}/{totalCount}
              </span>{' '}
              món đồ ({progressPercent}%)
            </p>
          </div>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nhập nhanh món đồ cần mang..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-2 text-xs font-bold text-white transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
        </form>
      </div>

      {/* Danh sách đồ cần mang có checkbox */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-400 animate-pulse">
            Đang tải danh sách hành lý...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Chưa có món đồ nào trong danh sách hành lý.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70"
              >
                <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggle(item)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      item.checked
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-300 bg-white text-transparent hover:border-teal-500'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span
                    className={`text-xs font-bold truncate ${
                      item.checked ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.name}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  title="Xóa món đồ"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};