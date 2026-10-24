'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

export interface TripHeaderCardProps {
  title: string;
  subtitle: string;
  dateRange: string;
  bannerUrl: string;
  onBack?: () => void;
}

export const TripHeaderCard: React.FC<TripHeaderCardProps> = ({
  title,
  subtitle,
  dateRange,
  bannerUrl,
  onBack,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center mb-6">
      
      {/* 1. Khung ảnh nền lớn (Banner Background) */}
      <div className="relative w-full h-[220px] sm:h-[240px] rounded-2xl overflow-hidden shadow-sm">
        <img src={bannerUrl} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/10" />

        {/* Nút quay lại góc trên trái của banner */}
        <div className="absolute top-4 left-4 z-10">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
          >
            <span>〈</span>
            <span>CHUYẾN ĐI</span>
          </button>
        </div>
      </div>

      {/* 2. Khung thẻ trắng info (Đã thu gọn chiều ngang lại bằng w-[84%] hoặc max-w-[88%] thay vì trải sát viền) */}
      <div className="relative z-20 -mt-16 w-[86%] sm:w-[84%] max-w-[500px] bg-white rounded-2xl shadow-xl px-6 py-5 flex flex-col justify-between space-y-3 border border-slate-100/90 backdrop-blur-xs">
        
        {/* Tên chuyến đi */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
          {title}
        </h1>

        {/* Cụm thông tin mô tả & Thời gian */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
          <p className="text-xs text-[#64748B] font-medium">{subtitle}</p>
          
          <div className="flex items-center gap-2 text-xs font-bold text-[#334155]">
            <Calendar className="w-4 h-4 text-[#14B8A6]" />
            <span>{dateRange}</span>
          </div>
        </div>

      </div>

    </div>
  );
};