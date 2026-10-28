'use client';

import React from 'react';
import { Pencil, Archive, Trash2, Plus } from 'lucide-react';

export interface TripCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  memberCount: number;
  dayCount: number;
  placeCount: number;
  isArchived?: boolean; // <-- Thêm prop trạng thái lưu trữ
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  id,
  title,
  imageUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
  memberCount,
  dayCount,
  placeCount,
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
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.06)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      className={`relative w-full rounded-[22px] border border-[#E2E8F0] bg-white overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${
        isArchived ? 'opacity-80 saturate-75' : ''
      }`}
    >
      {/* 1. Phần ảnh bìa phía trên */}
      <div className="relative w-full h-[175px] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Lớp phủ gradient chuẩn từ SVG */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isArchived
              ? 'linear-gradient(180deg, rgba(100, 116, 139, 0) 45%, #475569 100%)'
              : 'linear-gradient(180deg, rgba(100, 116, 139, 0) 45%, #0D9488 100%)',
          }}
        />

        {/* Huy hiệu hiển thị khi đã lưu trữ */}
        {isArchived && (
          <div className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 rounded-md bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-extrabold tracking-wider uppercase">
            ĐÃ LƯU TRỮ
          </div>
        )}

        {/* Cụm 3 nút icon góc trên phải */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(id);
            }}
            className="w-8 h-8 rounded-full bg-[#0F766E] hover:bg-[#115E59] flex items-center justify-center text-white transition-all shadow-sm active:scale-90"
            title="Sửa"
          >
            <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Nút Archive đổi màu trực quan khi đã lưu trữ */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all shadow-sm active:scale-90 ${
              isArchived 
                ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-white/50' 
                : 'bg-[#0F766E] hover:bg-[#115E59]'
            }`}
            title={isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
          >
            <Archive className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(id);
            }}
            className="w-8 h-8 rounded-full bg-[#0F766E] hover:bg-[#115E59] flex items-center justify-center text-white transition-all shadow-sm active:scale-90"
            title="Xóa"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

        {/* Tiêu đề chuyến đi */}
        <div className="absolute bottom-3 left-4 right-4 z-10">
          <h3 className="text-[20px] font-extrabold text-white tracking-wide uppercase drop-shadow-sm truncate">
            {title}
          </h3>
        </div>
      </div>

      {/* 2. Phần thông số 3 cột phía dưới */}
      <div className="h-[80px] bg-[#F8FAFC] flex items-center justify-around px-2 text-center">
        {/* Cột Thành viên */}
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-[17px] font-extrabold text-[#0F172A] leading-tight">
            {memberCount}
          </span>
          <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
            thành viên
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#E2E8F0]" />

        {/* Cột Ngày */}
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-[17px] font-extrabold text-[#0F172A] leading-tight">
            {dayCount}
          </span>
          <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
            Ngày
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#E2E8F0]" />

        {/* Cột Địa điểm */}
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-[17px] font-extrabold text-[#0F172A] leading-tight">
            {placeCount}
          </span>
          <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
            Địa điểm
          </span>
        </div>
      </div>
    </div>
  );
};

/* Thẻ tạo chuyến đi mới (Dashed Card) */
export interface CreateTripDashedCardProps {
  onClick?: () => void;
}

export const CreateTripDashedCard: React.FC<CreateTripDashedCardProps> = ({
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="w-full min-h-[255px] h-full rounded-[20px] border-2 border-dashed border-[#94A3B8]/70 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-slate-100 hover:border-[#14B8A6] group"
    >
      <div className="w-[44px] h-[44px] rounded-full bg-[#14B8A6] flex items-center justify-center text-white mb-3.5 shadow-sm group-hover:scale-110 transition-transform">
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </div>

      <span className="text-[16px] font-bold text-[#0F172A] tracking-tight">
        Chuyến đi mới
      </span>
      <span className="text-[12px] font-normal text-[#64748B] mt-1">
        Lên kế hoạch cho 1 chuyến đi mới
      </span>
    </div>
  );
};