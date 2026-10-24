'use client';

import React from 'react';

export type TripFilterType = 'all' | 'planned' | 'archived' | 'completed';

interface FilterOption {
  id: TripFilterType;
  label: string;
}

export interface TripFilterBarProps {
  title?: string;
  activeFilter?: TripFilterType;
  onFilterChange?: (filter: TripFilterType) => void;
}

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'planned', label: 'Đã lên kế hoạch' },
  { id: 'archived', label: 'Lưu trữ' },
  { id: 'completed', label: 'Đã hoàn thành' },
];

export const TripFilterBar: React.FC<TripFilterBarProps> = ({
  title = 'Chuyến đi của tôi',
  activeFilter = 'all',
  onFilterChange,
}) => {
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
    >
      {/* Tiêu đề mục */}
      <h2 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight">
        {title}
      </h2>

      {/* Thanh công cụ lọc */}
      <div className="flex items-center h-[46px] p-1 bg-[#64748B]/[0.05] border border-[#E2E8F0] rounded-[14px] overflow-x-auto">
        {filterOptions.map((option) => {
          const isActive = activeFilter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange?.(option.id)}
              style={
                isActive
                  ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.05)' }
                  : undefined
              }
              className={`h-[36px] px-4 rounded-[11px] text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#0F172A]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};