'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { TripResponse } from '@/types/trip';
import { DEFAULT_DESTINATIONS } from '@/mocks/exploreData';

interface TripCardProps {
  trip: TripResponse;
  onEdit?: (trip: TripResponse) => void;
  onDelete?: (trip: TripResponse) => void;
}

const PROVINCE_COVER_IMAGES: Record<string, string> = {
  '68': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  '48': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
  '79': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
  '01': 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=800&q=80',
  '77': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  '56': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
  '91': 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=800&q=80',
  '37': 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  '22': 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  '46': 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=800&q=80',
};

const TRIP_FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
];

function getCoverImage(trip: TripResponse): string {
  const code = trip.provinceCode ? String(trip.provinceCode) : '';
  if (code && PROVINCE_COVER_IMAGES[code]) {
    return PROVINCE_COVER_IMAGES[code];
  }
  const idx = Math.abs(Number(trip.tripId) || 0) % TRIP_FALLBACK_COVERS.length;
  return TRIP_FALLBACK_COVERS[idx];
}

export default function TripCard({ trip, onEdit, onDelete }: TripCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const calculateDays = (start: string, end: string) => {
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const days = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? `${days} ngày` : '1 ngày';
    } catch {
      return '1 ngày';
    }
  };

  const destinationLabel =
    trip.destinationName ||
    DEFAULT_DESTINATIONS.find((d) => d.provinceCode === trip.provinceCode)?.name ||
    (trip.provinceCode ? `Mã tỉnh #${trip.provinceCode}` : `Điểm đến #${trip.destinationId ?? 1}`);

  const coverUrl = getCoverImage(trip);
  const isCompleted = trip.status === 'COMPLETED';

  return (
    <div
      style={{
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.05)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      className="group relative flex flex-col overflow-hidden rounded-[22px] border border-[#E2E8F0] bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* 1. Ảnh bìa theo điểm đến + Badge trạng thái + Nút sửa/xóa */}
      <Link href={`/trips/${trip.tripId}`} className="relative block h-[165px] w-full overflow-hidden bg-slate-100">
        <img
          src={coverUrl}
          alt={trip.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isCompleted
              ? 'linear-gradient(180deg, rgba(15,23,42,0.08) 35%, rgba(51,65,85,0.88) 100%)'
              : 'linear-gradient(180deg, rgba(15,23,42,0.08) 35%, rgba(13,148,136,0.88) 100%)',
          }}
        />

        {/* Badge Tỉnh/Thành trên góc trái */}
        <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0F172A] shadow-xs">
          <MapPin className="w-3 h-3 text-[#14B8A6]" />
          <span>{destinationLabel}</span>
        </div>

        {/* Cụm nút Sửa / Xóa góc phải */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(trip);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F766E] text-white shadow-xs transition-all hover:bg-[#115E59] active:scale-90 cursor-pointer"
              title="Chỉnh sửa chuyến đi"
              aria-label="Chỉnh sửa chuyến đi"
            >
              <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(trip);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F766E] text-white shadow-xs transition-all hover:bg-rose-600 active:scale-90 cursor-pointer"
              title="Xóa chuyến đi"
              aria-label="Xóa chuyến đi"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          )}
        </div>

        {/* Trạng thái & Tên chuyến đi ở đáy ảnh bìa */}
        <div className="absolute bottom-3.5 left-4 right-4 z-10 flex items-end justify-between gap-2">
          <h3 className="text-[18px] font-extrabold text-white leading-snug line-clamp-1 drop-shadow-sm">
            {trip.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${
              isCompleted
                ? 'bg-slate-900/75 text-slate-100'
                : 'bg-white/25 text-white border border-white/40 backdrop-blur-xs'
            }`}
          >
            {isCompleted ? 'Hoàn thành' : 'Đang lên lịch'}
          </span>
        </div>
      </Link>

      {/* 2. Thông tin chi tiết & Hành động */}
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2.5">
          {trip.description ? (
            <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
              {trip.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Chưa có ghi chú mô tả cho hành trình này.
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-[#334155] font-semibold tabular-nums pt-0.5">
            <Calendar className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <span>
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-[#0F766E]">
              {calculateDays(trip.startDate, trip.endDate)}
            </span>
          </div>
        </div>

        <Link
          href={`/trips/${trip.tripId}`}
          className="w-full h-[40px] rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm shadow-teal-500/20 flex items-center justify-center gap-1.5"
        >
          <span>Mở lịch trình chuyến đi</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
