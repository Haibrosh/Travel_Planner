'use client';

import React, { useState } from 'react';
import { GripVertical, MoreHorizontal, Pencil } from 'lucide-react';
import { TripActivityPopupMenu } from './TripActivityPopupMenu';

export interface TripActivityCardProps {
  index: number;
  title: string;
  timeRange: string;
  tags: string[];
  note: string;
  imageUrl: string;
  onAddTime?: () => void;
  onAddNote?: () => void;
  onDelete?: () => void;
}

export const TripActivityCard: React.FC<TripActivityCardProps> = ({
  index,
  title,
  timeRange,
  tags,
  note,
  imageUrl,
  onAddTime,
  onAddNote,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative flex items-center w-full group">
      
      {/* 1. Nút 6 chấm (Drag Handle) */}
      <div className="absolute -left-6 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing transition-all hidden sm:flex items-center justify-center">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* 2. Số thứ tự tròn màu xanh ngọc */}
      <div className="absolute -left-3.5 top-6 z-20 w-7 h-7 rounded-full bg-[#0D9488] text-white font-extrabold text-xs flex items-center justify-center shadow-md border-2 border-white">
        {index}
      </div>

      {/* 3. Khung nội dung chính & Ảnh liền kề */}
      <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex items-stretch justify-between relative hover:shadow-md transition-all">
        
        {/* Phần nội dung bên trái */}
        <div className="flex-1 p-5 pl-7 flex flex-col justify-between space-y-3 min-w-0">
          
          {/* Tên địa điểm & Nút 3 chấm kèm Popup */}
          <div className="flex items-start justify-between gap-2 relative">
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight truncate">
              {title}
            </h3>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer flex-shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Popup menu khớp với props mới */}
              {showMenu && (
                <TripActivityPopupMenu
                  onAddTime={onAddTime}
                  onAddNote={onAddNote}
                  onDelete={onDelete}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </div>
          </div>

          {/* Mốc thời gian */}
          <p className="text-xs font-bold text-[#64748B]">{timeRange}</p>

          {/* Các Tag danh mục */}
          {tags && tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E] text-white text-[11px] font-bold shadow-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Ghi chú cá nhân */}
          {note && (
            <p className="text-xs text-[#64748B] font-medium pt-1 flex items-center gap-1.5 truncate">
              <Pencil className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
              <span>{note}</span>
            </p>
          )}

        </div>

        {/* Phần khung ảnh bên phải */}
        <div className="relative w-[180px] sm:w-[200px] flex-shrink-0 bg-slate-100 rounded-r-2xl overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>

      </div>

    </div>
  );
};