'use client';

import React from 'react';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

export interface ItineraryDayHeaderProps {
  currentDate: string;
  totalPlaces: number;
  isFilteredByMap?: boolean;
  onToggleMapFilter?: () => void;
  onOptimizeRoute?: () => void;
}

export const ItineraryDayHeader: React.FC<ItineraryDayHeaderProps> = ({
  currentDate,
  totalPlaces,
  isFilteredByMap = false,
  onToggleMapFilter,
  onOptimizeRoute,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Cột trái: Ngày & Tổng số địa điểm */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          <Calendar className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
            Lịch trình ngày {currentDate}
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Tổng số: <span className="font-bold text-teal-700">{totalPlaces}</span> địa điểm
          </p>
        </div>
      </div>

      {/* Cột phải: Các nút tương tác (Lọc bản đồ & Tối ưu lộ trình) */}
      <div className="flex items-center gap-2">
        {/* Nút Lọc hiển thị trên bản đồ */}
        <button
          type="button"
          onClick={onToggleMapFilter}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isFilteredByMap
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Chỉ hiển thị các điểm của ngày này lên bản đồ"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{isFilteredByMap ? 'Đang lọc bản đồ' : 'Xem ngày này trên bản đồ'}</span>
        </button>

        {/* Nút Tối ưu lộ trình */}
        <button
          type="button"
          onClick={onOptimizeRoute}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          title="Tự động sắp xếp lại lộ trình tối ưu"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tối ưu lộ trình</span>
        </button>
      </div>
    </div>
  );
};