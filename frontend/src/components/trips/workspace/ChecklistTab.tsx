'use client';

import { useState } from 'react';

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

const INITIAL_ITEMS: ChecklistItem[] = [
  { id: '1', name: 'CCCD / Hộ chiếu bản gốc', category: 'Giấy tờ', checked: true },
  { id: '2', name: 'Bằng lái xe & Giấy tờ xe', category: 'Giấy tờ', checked: true },
  { id: '3', name: 'Sạc điện thoại & Pin dự phòng', category: 'Công nghệ', checked: false },
  { id: '4', name: 'Thuốc say xe & Thuốc cảm hạ sốt', category: 'Y tế & Cá nhân', checked: false },
  { id: '5', name: 'Kem chống nắng & Kính râm', category: 'Y tế & Cá nhân', checked: true },
  { id: '6', name: 'Đồ bơi & Khăn tắm biển', category: 'Trang phục', checked: false },
  { id: '7', name: '3 bộ quần áo thoáng mát', category: 'Trang phục', checked: false },
];

export default function ChecklistTab() {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_ITEMS);

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const completedCount = items.filter((i) => i.checked).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-6">
      {/* Progress header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Tiến độ chuẩn bị hành lý
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Đã chuẩn bị {completedCount}/{items.length} món đồ ({progressPercent}%)
            </p>
          </div>
          <button
            onClick={() => {
              const name = prompt('Tên món đồ cần mang:');
              if (name) {
                setItems([
                  ...items,
                  {
                    id: String(Date.now()),
                    name,
                    category: 'Cá nhân',
                    checked: false,
                  },
                ]);
              }
            }}
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Thêm món đồ
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Items by Category */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="bg-zinc-50/70 px-5 py-2.5 border-b border-zinc-100 dark:bg-zinc-800/40 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                {category}
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {items
                .filter((item) => item.category === category)
                .map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/50 cursor-pointer dark:hover:bg-zinc-800/20"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleCheck(item.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <span
                      className={`text-sm ${
                        item.checked
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {item.name}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
