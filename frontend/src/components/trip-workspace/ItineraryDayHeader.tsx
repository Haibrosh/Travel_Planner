'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Compass, MapPin, Sparkles } from 'lucide-react';

export interface ItineraryDayHeaderProps {
  dayNumber?: number;
  currentDate: string;
  totalPlaces: number;
  isFilteredByMap?: boolean;
  onToggleMapFilter?: () => void;
  onOptimizeRoute?: () => void;
  isOptimizing?: boolean;
  canOptimize?: boolean;
  exploreHref?: string;
}

export const ItineraryDayHeader: React.FC<ItineraryDayHeaderProps> = ({
  dayNumber,
  currentDate,
  totalPlaces,
  isFilteredByMap = false,
  onToggleMapFilter,
  onOptimizeRoute,
  isOptimizing = false,
  canOptimize = totalPlaces >= 2,
  exploreHref,
}) => {
  const isOptimizeDisabled = isOptimizing || !canOptimize || !onOptimizeRoute;
  const optimizeTitle = !canOptimize
    ? 'Cần ít nhất 2 địa điểm trong ngày để tối ưu lộ trình'
    : 'Tự động sắp xếp lại lộ trình tối ưu (2-opt)';

  return (
    <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Hàng trên: Ngày & Tổng số địa điểm */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
          <Calendar className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight dark:text-zinc-50">
            {dayNumber !== undefined
              ? `Lộ trình Ngày ${dayNumber}`
              : `Lịch trình ngày ${currentDate}`}
          </h2>
          <p className="text-xs font-medium text-slate-500 tabular-nums dark:text-zinc-400">
            {dayNumber !== undefined ? (
              <>
                {currentDate} • Tổng số:{' '}
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  {totalPlaces}
                </span>{' '}
                địa điểm
              </>
            ) : (
              <>
                Tổng số:{' '}
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  {totalPlaces}
                </span>{' '}
                địa điểm
              </>
            )}
          </p>
        </div>
      </div>

      {/* Hàng dưới: Các nút tương tác (Lọc bản đồ, Tối ưu lộ trình, Khám phá thêm) */}
      <div className="flex flex-wrap items-center gap-2">
        {onToggleMapFilter && (
          <button
            type="button"
            onClick={onToggleMapFilter}
            aria-pressed={isFilteredByMap}
            className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              isFilteredByMap
                ? 'bg-teal-600 text-white shadow-xs hover:bg-teal-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
            }`}
            title={
              isFilteredByMap
                ? 'Đang chỉ xem các địa điểm của ngày này trên bản đồ — bấm để xem cả chuyến đi'
                : 'Chỉ hiển thị các điểm của ngày này lên bản đồ'
            }
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isFilteredByMap ? 'Đang lọc ngày này' : 'Xem ngày này trên bản đồ'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOptimizeRoute}
          disabled={isOptimizeDisabled}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          title={optimizeTitle}
        >
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Đang tối ưu...' : 'Tối ưu lộ trình'}</span>
        </button>

        {exploreHref && (
          <Link
            href={exploreHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600/30 bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors dark:border-teal-700/50 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/50"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Khám phá thêm</span>
          </Link>
        )}
      </div>
    </div>
  );
};