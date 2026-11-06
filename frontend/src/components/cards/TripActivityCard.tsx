'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Pencil, MoreHorizontal, GripVertical, Check } from 'lucide-react';
import { TripActivityPopupMenu } from './TripActivityPopupMenu';

export interface TripActivityCardProps {
  index: number;
  title: string;
  timeRange: string;
  tags?: string[];
  note?: string;
  imageUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
  onOpenUpdateModal?: () => void;
  onUpdateActivity?: (updatedData: { timeRange?: string; note?: string }) => void;
  onDeleteActivity?: () => void;
  dragHandleProps?: any;
}

export const TripActivityCard: React.FC<TripActivityCardProps> = ({
  index,
  title,
  timeRange,
  tags = [],
  note,
  imageUrl,
  isSelected = false,
  onClick,
  onOpenUpdateModal,
  onUpdateActivity,
  onDeleteActivity,
  dragHandleProps,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // State chỉnh sửa trực tiếp (inline editing)
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(timeRange);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(note || '');

  const timeInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTime) timeInputRef.current?.focus();
  }, [isEditingTime]);

  useEffect(() => {
    if (isEditingNote) noteInputRef.current?.focus();
  }, [isEditingNote]);

  const handleSaveTime = () => {
    setIsEditingTime(false);
    if (tempTime.trim() !== timeRange) {
      onUpdateActivity?.({ timeRange: tempTime.trim() });
    }
  };

  const handleSaveNote = () => {
    setIsEditingNote(false);
    if (tempNote.trim() !== (note || '')) {
      onUpdateActivity?.({ note: tempNote.trim() });
    }
  };

  return (
    <div className="relative flex items-center w-full my-3 pl-8 overflow-visible">
      {/* 1. Nút 6 chấm kéo thả */}
      <div
        {...dragHandleProps}
        className="absolute left-0 z-20 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1"
        title="Kéo để sắp xếp"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 2. Khung Card chính */}
      <div
        onClick={onClick}
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className={`relative w-full rounded-[20px] border bg-white flex items-stretch cursor-pointer transition-all ${
          isSelected
            ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        {/* Badge số thứ tự đè viền */}
        <div className="absolute -left-3.5 top-6 z-30 w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-extrabold flex items-center justify-center shadow-md border-2 border-white">
          {index}
        </div>

        {/* Nội dung thông tin bên trái */}
        <div className="flex-1 p-5 pl-6 flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-3 relative">
            <h4 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight truncate">
              {title}
            </h4>
            
            {/* Nút 3 chấm mở Popup menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer z-30"
                title="Tùy chọn"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* Popup menu nhỏ */}
              {showMenu && (
                <div onClick={(e) => e.stopPropagation()}>
                  <TripActivityPopupMenu
                    onClose={() => setShowMenu(false)}
                    onAddTime={() => {
                      setShowMenu(false);
                      setIsEditingTime(true);
                    }}
                    onAddNote={() => {
                      setShowMenu(false);
                      setIsEditingNote(true);
                    }}
                    onDelete={() => {
                      setShowMenu(false);
                      onDeleteActivity?.();
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dòng Thời gian (Sửa trực tiếp khi bấm) */}
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] mt-1.5">
            <Clock className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
            {!isEditingTime ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTime(true);
                }}
                className="hover:text-teal-600 hover:underline cursor-pointer"
                title="Bấm để chỉnh sửa thời gian"
              >
                {timeRange}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={timeInputRef}
                  type="text"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTime()}
                  className="bg-slate-50 border border-teal-500 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 outline-none w-full max-w-[200px]"
                />
                <button
                  type="button"
                  onClick={handleSaveTime}
                  className="p-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1 rounded-full bg-[#0F766E] text-white text-[11px] font-bold tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Dòng Ghi chú (Sửa trực tiếp khi bấm) */}
            {!isEditingNote ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNote(true);
                }}
                className="flex items-center gap-2 text-xs font-medium text-[#64748B] hover:text-teal-600 cursor-pointer group"
                title="Bấm để chỉnh sửa ghi chú"
              >
                <Pencil className="w-3.5 h-3.5 text-[#64748B] group-hover:text-teal-600 shrink-0" />
                <span className="truncate">{note || 'Thêm ghi chú...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Pencil className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <input
                  ref={noteInputRef}
                  type="text"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                  placeholder="Nhập ghi chú..."
                  className="bg-slate-50 border border-teal-500 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="p-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phần hình ảnh cover bên phải */}
        {imageUrl && (
          <div className="relative w-[130px] sm:w-[150px] shrink-0 overflow-hidden rounded-r-[20px] bg-slate-100">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};