'use client';

import React from 'react';

export type CategoryType = 'all' | 'cafe' | 'food' | 'photo' | 'homestay' | 'sightseeing' | 'entertainment';

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
  { id: 'cafe', label: 'Cà phê' },
  { id: 'food', label: 'Ẩm thực' },
  { id: 'photo', label: 'Chụp ảnh' },
  { id: 'homestay', label: 'Homestay' },
  { id: 'sightseeing', label: 'Tham quan' },
  { id: 'entertainment', label: 'Vui chơi' },
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
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-xs flex-shrink-0 ${
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