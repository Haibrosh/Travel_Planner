'use client';

import React from 'react';
import { MapPin, Plus } from 'lucide-react';

export interface ExploreCardProps {
  id: string | number;
  title: string;
  imageUrl: string;
  tags: string[];
  address: string;
  onAddToTrip?: (id: string | number) => void;
  onClick?: (id: string | number) => void;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({
  id,
  title,
  imageUrl,
  tags,
  address,
  onAddToTrip,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick?.(id)}
      style={{
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.06)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      className="relative w-full rounded-[22px] border border-[#E2E8F0] bg-white overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col"
    >
      {/* 1. Phần ảnh bìa phía trên */}
      <div className="relative w-full h-[180px] overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* 2. Phần nội dung phía dưới */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Tiêu đề & Danh mục tags */}
        <div className="space-y-2.5">
          <h3 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight truncate">
            {title}
          </h3>
          
          {/* Danh mục tags (Ví dụ: Tham quan, Chụp ảnh) */}
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-[#0F766E] text-white text-[11px] font-bold tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Địa chỉ chi tiết */}
        <div className="flex items-start gap-2 text-xs text-[#64748B]">
          <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-relaxed">{address}</span>
        </div>

        {/* Nút hành động: + Thêm vào chuyến đi */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToTrip?.(id);
            }}
            className="w-full h-[40px] rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Thêm vào chuyến đi
          </button>
        </div>

      </div>
    </div>
  );
};