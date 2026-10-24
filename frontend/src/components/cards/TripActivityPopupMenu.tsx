'use client';

import React, { useEffect, useRef } from 'react';
import { Clock, Pencil, Trash2 } from 'lucide-react';

interface TripActivityPopupMenuProps {
  onAddTime?: () => void;
  onAddNote?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const TripActivityPopupMenu: React.FC<TripActivityPopupMenuProps> = ({
  onAddTime,
  onAddNote,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-8 z-50 w-[145px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-slate-100 py-1.5 flex flex-col text-xs text-[#64748B] font-bold animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Nút Thêm giờ / Sửa giờ */}
      <button
        type="button"
        onClick={() => {
          onAddTime?.();
          onClose();
        }}
        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer text-[#64748B]"
      >
        <Clock className="w-4 h-4 text-[#64748B] flex-shrink-0" />
        <span>Thêm giờ</span>
      </button>

      {/* Nút Thêm ghi chú */}
      <button
        type="button"
        onClick={() => {
          onAddNote?.();
          onClose();
        }}
        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer text-[#64748B]"
      >
        <Pencil className="w-4 h-4 text-[#64748B] flex-shrink-0" />
        <span>Thêm ghi chú</span>
      </button>

      {/* Đường kẻ ngang phân cách */}
      <div className="h-px bg-slate-100 my-1 mx-2" />

      {/* Nút Xóa địa điểm */}
      <button
        type="button"
        onClick={() => {
          onDelete?.();
          onClose();
        }}
        className="w-full px-4 py-2.5 text-left hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer text-[#64748B] hover:text-rose-600 group"
      >
        <Trash2 className="w-4 h-4 text-[#64748B] group-hover:text-rose-500 flex-shrink-0" />
        <span>Xóa địa điểm</span>
      </button>
    </div>
  );
};