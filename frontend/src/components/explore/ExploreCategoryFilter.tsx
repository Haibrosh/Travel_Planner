'use client';

import React from 'react';

export type CategoryType = 'all' | 'attraction' | 'restaurant' | 'cafe' | 'hotel';

export interface CategoryItem {
  id: CategoryType;
  label: string;
}

interface ExploreCategoryFilterProps {
  categories?: CategoryItem[];
  activeCategory: CategoryType;
  onSelectCategory: (id: CategoryType) => void;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'attraction', label: 'Điểm tham quan' },
  { id: 'restaurant', label: 'Nhà hàng' },
  { id: 'cafe', label: 'Quán cà phê' },
  { id: 'hotel', label: 'Khách sạn & Lưu trú' },
];

export const ExploreCategoryFilter: React.FC<ExploreCategoryFilterProps> = ({
  categories = DEFAULT_CATEGORIES,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 px-4 no-scrollbar">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-xs flex-shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/20'
                : 'bg-[#E2E8F0]/60 text-[#334155] hover:bg-[#E2E8F0]'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
