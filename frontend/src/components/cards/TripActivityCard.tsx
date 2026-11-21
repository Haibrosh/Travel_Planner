'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Pencil, MoreHorizontal, GripVertical, Check } from 'lucide-react';
import { TripActivityPopupMenu } from './TripActivityPopupMenu';

export interface TripActivityCardProps {
  index: number;
  title: string;
  timeRange: string;
  tags?: string[];
  note?: string | null;
  imageUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
  // Props tương thích với nhánh main (API / menuSlot / inline edit)
  menuSlot?: React.ReactNode;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onSaveEdit?: (data: {
    startTime: string | null;
    endTime: string | null;
    note: string | null;
  }) => void;
  // Props UI & kéo thả
  onOpenUpdateModal?: () => void;
  onUpdateActivity?: (updatedData: { timeRange?: string; note?: string }) => void;
  onDeleteActivity?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
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
  menuSlot,
  isEditing: controlledEditing,
  onStartEdit,
  onSaveEdit,
  onOpenUpdateModal,
  onUpdateActivity,
  onDeleteActivity,
  dragHandleProps,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Chỉnh sửa trực tiếp thời gian & ghi chú
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(timeRange);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(note || '');

  const timeInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempTime(timeRange);
  }, [timeRange]);

  useEffect(() => {
    setTempNote(note || '');
  }, [note]);

  useEffect(() => {
    if (isEditingTime) timeInputRef.current?.focus();
  }, [isEditingTime]);

  useEffect(() => {
    if (isEditingNote || controlledEditing) noteInputRef.current?.focus();
  }, [isEditingNote, controlledEditing]);

  const handleSaveTime = () => {
    setIsEditingTime(false);
    const nextTime = tempTime.trim();
    if (nextTime !== timeRange) {
      onUpdateActivity?.({ timeRange: nextTime });
    }
  };

  const handleSaveNote = () => {
    setIsEditingNote(false);
    const nextNote = tempNote.trim();
    if (nextNote !== (note || '')) {
      onUpdateActivity?.({ note: nextNote });
      onSaveEdit?.({
        startTime: null,
        endTime: null,
        note: nextNote || null,
      });
    }
  };

  const showNoteEditor = Boolean(isEditingNote || controlledEditing);

  return (
    <div className="relative flex items-center w-full my-3 pl-8 overflow-visible">
      {/* 1. Nút 6 chấm kéo thả */}
      <div
        {...dragHandleProps}
        className="absolute left-0 z-20 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1 transition-colors"
        title="Kéo để sắp xếp"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 2. Khung Card chính */}
      <div
        onClick={onClick}
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className={`relative w-full rounded-[20px] border bg-white flex items-stretch cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
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

            {/* Menu slot từ main hoặc popup menu */}
            {menuSlot ? (
              <div onClick={(e) => e.stopPropagation()} className="z-30 shrink-0">
                {menuSlot}
              </div>
            ) : (
              <div className="relative shrink-0">
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
                        onStartEdit?.();
                      }}
                      onDelete={() => {
                        setShowMenu(false);
                        onDeleteActivity?.();
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dòng Thời gian */}
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] mt-1.5">
            <Clock className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
            {!isEditingTime ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTime(true);
                }}
                className="hover:text-teal-600 hover:underline cursor-pointer transition-colors"
                title="Bấm để chỉnh sửa thời gian"
              >
                {timeRange}
              </span>
            ) : (
              <div
                className="flex items-center gap-1.5 flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={timeInputRef}
                  type="text"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTime()}
                  className="bg-slate-50 border border-teal-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none w-full max-w-[200px] shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveTime}
                  className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
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
                    className="px-3.5 py-1 rounded-full bg-[#0F766E] text-white text-[11px] font-bold tracking-wide shadow-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Dòng Ghi chú */}
            {!showNoteEditor ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNote(true);
                  onStartEdit?.();
                  onOpenUpdateModal?.();
                }}
                className="flex items-center gap-2 text-xs font-medium text-[#64748B] hover:text-teal-600 cursor-pointer group transition-colors"
                title="Bấm để chỉnh sửa ghi chú"
              >
                <Pencil className="w-3.5 h-3.5 text-[#64748B] group-hover:text-teal-600 shrink-0 transition-colors" />
                <span className="truncate">{note || 'Thêm ghi chú...'}</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Pencil className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <input
                  ref={noteInputRef}
                  type="text"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                  placeholder="Nhập ghi chú..."
                  className="bg-slate-50 border border-teal-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none flex-1 shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};