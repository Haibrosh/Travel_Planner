'use client';

import React from 'react';
import { Clock, MapPin } from 'lucide-react';

export interface TripActivityCardProps {
  index: number;
  title: string;
  timeRange: string;
  tags?: string[];
  note?: string;
  imageUrl?: string;
  isSelected?: boolean; // Prop nhận trạng thái active
  onClick?: () => void;
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
}) => {
  return (
    <div
      onClick={onClick}
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className={`w-full bg-white rounded-2xl border p-4 shadow-xs flex flex-col gap-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Số thứ tự badge */}
          <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-xs">
            {index}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 truncate">
              {title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{timeRange}</span>
            </div>
          </div>
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
          />
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

      {note && (
        <p className="text-xs text-slate-500 font-medium italic border-t border-slate-100 pt-2.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{note}</span>
        </p>
      )}
    </div>
  );
};