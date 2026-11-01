'use client';

import Link from 'next/link';
import type { TripResponse } from '@/types/trip';
import { useDeleteTrip } from '@/hooks/useTrips';

interface TripCardProps {
  trip: TripResponse;
}

export default function TripCard({ trip }: TripCardProps) {
  const deleteMutation = useDeleteTrip();

  // Format dates: DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Tính số ngày
  const calculateDays = (start: string, end: string) => {
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const days = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? `${days} ngày` : '1 ngày';
    } catch {
      return '';
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${trip.name}"?`)) {
      await deleteMutation.mutateAsync(trip.tripId);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <span>📍</span>
            <span>Điểm đến #{trip.destinationId}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                trip.status === 'COMPLETED'
                  ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
              }`}
            >
              {trip.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang lên kế hoạch'}
            </span>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded"
              title="Xóa chuyến đi"
            >
              🗑️
            </button>
          </div>
        </div>

        <Link href={`/trips/${trip.tripId}`} className="block mt-3 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1">
            {trip.name}
          </h3>
          {trip.description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
              {trip.description}
            </p>
          )}
        </Link>
      </div>

      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span>📅</span>
          <span>
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {calculateDays(trip.startDate, trip.endDate)}
          </span>
        </div>

        <Link
          href={`/trips/${trip.tripId}`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100 inline-flex items-center gap-1"
        >
          Chi tiết <span>→</span>
        </Link>
      </div>
    </div>
  );
}
