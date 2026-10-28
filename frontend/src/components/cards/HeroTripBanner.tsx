'use client';

import React from 'react';
import { Pencil, Archive, Trash2, ArrowRight } from 'lucide-react';

export interface TripMember {
  id?: string;
  name?: string;
  label: string;
  bgColor?: string;
}

export interface HeroTripBannerProps {
  id: string;
  tag?: string;
  title: string;
  imageUrl?: string;
  members?: TripMember[];
  totalMembersCount?: number;
  startDay?: number | string;
  endDay?: number | string;
  startMonthText?: string;
  endMonthText?: string;
  totalPlacesCount?: number;
  isArchived?: boolean; // <-- Thêm prop trạng thái lưu trữ
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const HeroTripBanner: React.FC<HeroTripBannerProps> = ({
  id,
  tag = 'TIẾP THEO',
  title = 'ĐÀ LẠT MỘNG MƠ',
  imageUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
  members = [
    { label: 'L', bgColor: '#99F6E4' },
    { label: 'M', bgColor: '#2DD4BF' },
    { label: 'U', bgColor: '#0D9488' },
  ],
  totalMembersCount = 3,
  startDay = 7,
  endDay = 10,
  startMonthText = 'tháng 11',
  endMonthText = 'tháng 11',
  totalPlacesCount = 15,
  isArchived = false, // Mặc định là chưa lưu trữ
  onEdit,
  onArchive,
  onDelete,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick?.(id)}
      style={{
        boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.16)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      className={`relative w-full h-[320px] lg:h-[340px] rounded-[26px] overflow-hidden text-white select-none cursor-pointer group transition-all ${
        isArchived ? 'opacity-85 saturate-75' : ''
      }`}
    >
      {/* 1. Lớp ảnh bìa */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
      />

      {/* 2. Lớp chuyển màu Teal sang trong suốt (hoặc đậm hơn chút nếu đã lưu trữ) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isArchived
            ? 'linear-gradient(90deg, rgba(71, 85, 105, 0.96) 18%, rgba(71, 85, 105, 0.8) 45%, rgba(100, 116, 139, 0) 95%)'
            : 'linear-gradient(90deg, rgba(20, 184, 166, 0.96) 18%, rgba(20, 184, 166, 0.8) 45%, rgba(100, 116, 139, 0) 95%)',
        }}
      />

      {/* 3. Nội dung bên trong */}
      <div className="relative z-10 w-full h-full px-8 lg:px-12 py-8 flex flex-col justify-between">
        
        {/* Hàng 1: Tag & Cụm 3 nút tròn */}
        <div className="flex items-center justify-between">
          <div className={`px-6 py-2 rounded-full flex items-center justify-center shadow-md ${
            isArchived ? 'bg-slate-700' : 'bg-[#0F766E]'
          }`}>
            <span className="text-[13px] font-extrabold text-white tracking-widest uppercase">
              {isArchived ? 'ĐÃ LƯU TRỮ' : tag}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(id);
              }}
              className="w-11 h-11 rounded-full bg-[#0F766E] hover:bg-[#115E59] flex items-center justify-center text-white transition-all shadow-md active:scale-95"
              title="Chỉnh sửa"
            >
              <Pencil className="w-[19px] h-[19px] stroke-[2.2]" />
            </button>

            {/* Nút Archive đổi màu trực quan khi đã lưu trữ */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.(id);
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-95 ${
                isArchived 
                  ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-white/50' 
                  : 'bg-[#0F766E] hover:bg-[#115E59]'
              }`}
              title={isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
            >
              <Archive className="w-[19px] h-[19px] stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
              className="w-11 h-11 rounded-full bg-[#0F766E] hover:bg-[#115E59] flex items-center justify-center text-white transition-all shadow-md active:scale-95"
              title="Xóa"
            >
              <Trash2 className="w-[19px] h-[19px] stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Hàng 2: Tiêu đề Chuyến đi */}
        <div className="my-auto pl-1">
          <h1 className="text-[44px] lg:text-[52px] font-extrabold tracking-tight text-white uppercase drop-shadow-md leading-none">
            {title}
          </h1>
        </div>

        {/* Hàng 3: Khung thông số 3 cột kính mờ */}
        <div className="w-[530px] max-w-full h-[96px] rounded-[22px] bg-slate-200/20 border border-white/80 backdrop-blur-md flex items-center justify-between px-6 shadow-sm">
          
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[12px] text-white font-medium mb-1.5 opacity-90">
              Bạn đồng hành
            </span>
            <div className="flex items-center -space-x-1.5 mb-1">
              {members.slice(0, 3).map((m, idx) => (
                <span
                  key={idx}
                  style={{ backgroundColor: m.bgColor || '#2DD4BF' }}
                  className="w-[26px] h-[26px] rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-slate-900 shadow-xs"
                >
                  {m.label}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-white font-semibold">
              {totalMembersCount} thành viên
            </span>
          </div>

          <div className="h-[60px] border-r border-dashed border-white/60 mx-2" />

          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[12px] text-white font-medium mb-1 opacity-90">
              Thời gian
            </span>
            <div className="flex items-center gap-2 text-[20px] font-extrabold text-slate-900 leading-none">
              <span>{startDay}</span>
              <ArrowRight className="w-4 h-4 text-slate-900 stroke-[3]" />
              <span>{endDay}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white font-medium mt-1">
              <span>{startMonthText}</span>
              <span>{endMonthText}</span>
            </div>
          </div>

          <div className="h-[60px] border-r border-dashed border-white/60 mx-2" />

          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[12px] text-white font-medium mb-1.5 opacity-90">
              Địa điểm
            </span>
            <div className="flex items-center -space-x-1.5 mb-1">
              <span className="w-[26px] h-[26px] rounded-full bg-[#99F6E4] border-2 border-white" />
              <span className="w-[26px] h-[26px] rounded-full bg-[#99F6E4] border-2 border-white" />
              <span className="w-[26px] h-[26px] rounded-full bg-[#2DD4BF] border-2 border-white" />
              <span className="w-[26px] h-[26px] rounded-full bg-[#E2E8F0] border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-slate-900">
                +{Math.max(0, (totalPlacesCount ?? 0) - 3)}
              </span>
            </div>
            <span className="text-[11px] text-white font-semibold">
              {totalPlacesCount} địa điểm
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};