'use client';

import { useState } from 'react';
import type { TripResponse } from '@/types/trip';
import TripMapLoader from '@/components/map/TripMapLoader';

interface ItineraryTabProps {
  trip: TripResponse;
}

export default function ItineraryTab({ trip }: ItineraryTabProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Sinh danh sách các ngày trong chuyến đi
  const generateDays = () => {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const days = [];
      const current = new Date(start);

      let dayNum = 1;
      while (current <= end) {
        const dStr = current.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        });
        days.push({
          dayNum,
          dateLabel: dStr,
          rawDate: current.toISOString().split('T')[0],
        });
        current.setDate(current.getDate() + 1);
        dayNum++;
      }
      return days.length > 0 ? days : [{ dayNum: 1, dateLabel: trip.startDate, rawDate: trip.startDate }];
    } catch {
      return [{ dayNum: 1, dateLabel: trip.startDate, rawDate: trip.startDate }];
    }
  };

  const daysList = generateDays();

  return (
    <div className="flex h-[calc(100vh-125px)] w-full overflow-hidden">
      {/* Cột trái: Timeline lịch trình các ngày */}
      <div className="w-full md:w-[460px] lg:w-[500px] shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col overflow-y-auto">
        {/* Day Selector Chips */}
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {daysList.map((d, idx) => (
              <button
                key={d.dayNum}
                onClick={() => setSelectedDayIndex(idx)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedDayIndex === idx
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                Ngày {d.dayNum} ({d.dateLabel})
              </button>
            ))}
          </div>
        </div>

        {/* Nội dung ngày được chọn */}
        <div className="flex-1 p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Lộ trình Ngày {daysList[selectedDayIndex]?.dayNum}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {daysList[selectedDayIndex]?.dateLabel}
              </p>
            </div>

            <button
              onClick={() => alert('Tính năng thêm địa điểm đang kết nối với tab Khám phá.')}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              + Thêm địa điểm
            </button>
          </div>

          {/* Placeholder Timeline Items */}
          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800 mb-2">
              📍
            </div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Chưa có địa điểm nào trong ngày này
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Bạn có thể kéo thả và sắp xếp các điểm tham quan tại đây.
            </p>
          </div>

          {/* Gợi ý điểm đến mẫu */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Gợi ý hành trình mẫu
            </span>
            <div className="space-y-2.5">
              {[
                { time: '08:00', title: 'Ăn sáng bánh khọt Gốc Vú Sữa', cat: 'Ẩm thực' },
                { time: '10:30', title: 'Check-in Mũi Nghinh Phong & Tượng Chúa Kito', cat: 'Điểm tham quan' },
                { time: '14:30', title: 'Tắm biển & Thư giãn Bãi Sau', cat: 'Bãi biển' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 bg-white dark:border-zinc-800 dark:bg-zinc-800/60"
                >
                  <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-mono text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {item.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.cat}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Bản đồ tương tác */}
      <div className="hidden md:block flex-1 h-full relative bg-zinc-100 dark:bg-zinc-950">
        <TripMapLoader />
      </div>
    </div>
  );
}
