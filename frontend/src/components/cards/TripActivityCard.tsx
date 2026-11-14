'use client';

import React, { useState } from 'react';
import { Clock, FileText, Pencil, Check, X } from 'lucide-react';

export interface TripActivityCardProps {
  index: number;
  title: string;
  timeRange: string;
  startTime?: string | null;
  endTime?: string | null;
  tags?: string[];
  note?: string | null;
  imageUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
  menuSlot?: React.ReactNode;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (data: {
    startTime: string | null;
    endTime: string | null;
    note: string | null;
  }) => void;
}

export const TripActivityCard: React.FC<TripActivityCardProps> = ({
  index,
  title,
  timeRange,
  startTime,
  endTime,
  tags = [],
  note,
  imageUrl,
  isSelected = false,
  onClick,
  menuSlot,
  isEditing: controlledEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}) => {
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = controlledEditing ?? internalEditing;

  const [draftStart, setDraftStart] = useState(startTime ?? '');
  const [draftEnd, setDraftEnd] = useState(endTime ?? '');
  const [draftNote, setDraftNote] = useState(note ?? '');
  const [timeError, setTimeError] = useState<string | null>(null);

  const openEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftStart(startTime ?? '');
    setDraftEnd(endTime ?? '');
    setDraftNote(note ?? '');
    setTimeError(null);
    if (onStartEdit) onStartEdit();
    else setInternalEditing(true);
  };

  const closeEditor = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTimeError(null);
    if (onCancelEdit) onCancelEdit();
    else setInternalEditing(false);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (draftStart && draftEnd && draftEnd < draftStart) {
      setTimeError('Giờ kết thúc phải lớn hơn hoặc bằng giờ bắt đầu.');
      return;
    }
    setTimeError(null);
    onSaveEdit?.({
      startTime: draftStart.trim() ? draftStart.trim() : null,
      endTime: draftEnd.trim() ? draftEnd.trim() : null,
      note: draftNote.trim() ? draftNote.trim() : null,
    });
    if (onCancelEdit) onCancelEdit();
    else setInternalEditing(false);
  };

  return (
    <div
      onClick={onClick}
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className={`w-full bg-white rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-colors ${
        isSelected
          ? 'border-[#0F766E] bg-teal-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Số thứ tự badge */}
          <div className="w-7 h-7 rounded-full bg-[#0F766E] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
            {index}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 truncate">
              {title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{timeRange}</span>
              {onSaveEdit && !isEditing && (
                <button
                  type="button"
                  onClick={openEditor}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Sửa giờ & ghi chú</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cụm bên phải: menu ⋯ (nếu có) + ảnh (nếu có) */}
        {(menuSlot || imageUrl) && (
          <div className="flex items-start gap-2 shrink-0">
            {menuSlot}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={title}
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
              />
            )}
          </div>
        )}
      </div>

      {/* Tags danh mục */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-extrabold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hiển thị Ghi chú hoặc Form chỉnh sửa */}
      {isEditing ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5 text-xs"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-600">Giờ bắt đầu</span>
              <input
                type="time"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-600">Giờ kết thúc</span>
              <input
                type="time"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </label>
          </div>

          {timeError && (
            <p className="text-[11px] font-semibold text-rose-600">{timeError}</p>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-600">Ghi chú tham quan</span>
            <input
              type="text"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Ví dụ: Đặt bàn trước, mua vé cổng chính..."
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Hủy</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1 text-[11px] font-bold text-white hover:bg-teal-800 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Lưu</span>
            </button>
          </div>
        </div>
      ) : (
        note && (
          <p className="text-xs text-slate-600 font-medium border-t border-slate-100 pt-2.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{note}</span>
          </p>
        )
      )}
    </div>
  );
};
