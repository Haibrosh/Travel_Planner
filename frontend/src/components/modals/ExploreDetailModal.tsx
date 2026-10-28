'use client';

import React from 'react';
import { X, MapPin, Plus } from 'lucide-react';

export interface ExploreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
  description: string;
  tags: string[];
  address: string;
  onCancel?: () => void;
  onAddToTrip?: () => void;
}

export const ExploreDetailModal: React.FC<ExploreDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  imageUrl,
  description,
  tags,
  address,
  onCancel,
  onAddToTrip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      {/* Khung modal chính rộng 500px, bo góc 8px (hoặc 22px tuỳ giao diện tổng thể của bạn) */}
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        
        {/* 1. Phần ảnh bìa phía trên (Chiều cao ~280px) */}
        <div className="relative w-full h-[280px] bg-slate-100 overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Nút đóng (X) ở góc phải phía trên ảnh */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#64748B] hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Phần nội dung phía dưới nền #F8FAFC */}
        <div className="bg-[#F8FAFC] p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
          
          {/* Tiêu đề & Mô tả */}
          <div className="space-y-3">
            <h2 className="text-[24px] font-extrabold text-[#0F172A] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              {description}
            </p>
          </div>

          {/* Các chip danh mục (tags) */}
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-full bg-[#0F766E] text-white text-xs font-bold tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Địa chỉ chi tiết */}
          <div className="flex items-start gap-2.5 text-xs text-[#334155] bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
            <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#0F172A]">Địa chỉ:</span>
              <p className="leading-relaxed text-[#64748B]">{address}</p>
            </div>
          </div>

          {/* Hàng nút hành động phía dưới: Hủy & + Thêm vào chuyến đi */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onCancel?.();
                onClose();
              }}
              className="flex-1 h-[44px] rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold transition-all flex items-center justify-center shadow-xs active:scale-98"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToTrip?.();
                onClose();
              }}
              className="flex-[2] h-[44px] rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Thêm vào chuyến đi
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};