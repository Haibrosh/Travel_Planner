'use client';

import { useState } from 'react';
import { Calendar, MapPin, X } from 'lucide-react';
import { useUpdateTrip } from '@/hooks/useTrips';
import { useDestinations } from '@/hooks/usePlaces';
import { DEFAULT_DESTINATIONS } from '@/mocks/exploreData';
import type { TripResponse } from '@/types/trip';

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripResponse | null;
  onUpdated?: (trip: TripResponse) => void;
}

export default function EditTripModal(props: EditTripModalProps) {
  if (!props.isOpen || !props.trip) return null;
  return <EditTripModalContent key={props.trip.tripId} {...props} trip={props.trip} />;
}

function EditTripModalContent({
  onClose,
  trip,
  onUpdated,
}: EditTripModalProps & { trip: TripResponse }) {
  const updateTripMutation = useUpdateTrip();
  const { data: destinations } = useDestinations();

  const destinationOptions =
    destinations && destinations.length > 0 ? destinations : DEFAULT_DESTINATIONS;

  const [name, setName] = useState(() => trip.name || '');
  const [provinceCode, setProvinceCode] = useState<string>(
    () => trip.provinceCode || destinationOptions[0]?.provinceCode || '68'
  );
  const [startDate, setStartDate] = useState(() => trip.startDate || '');
  const [endDate, setEndDate] = useState(() => trip.endDate || '');
  const [description, setDescription] = useState(() => trip.description || '');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên chuyến đi.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    try {
      const updated = await updateTripMutation.mutateAsync({
        tripId: trip.tripId,
        data: {
          provinceCode,
          name: name.trim(),
          startDate,
          endDate,
          description: description.trim() || undefined,
        },
      });

      onUpdated?.(updated);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(
        apiErr?.response?.data?.message ||
          'Có lỗi xảy ra khi cập nhật chuyến đi. Vui lòng thử lại.'
      );
    }
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172A]">
              Chỉnh sửa chuyến đi
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cập nhật thông tin hành trình của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Tên chuyến đi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="VD: Khám phá Đà Lạt mộng mơ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Điểm đến chính <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#14B8A6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all cursor-pointer"
              >
                {destinationOptions.map((d) => (
                  <option key={d.provinceCode} value={d.provinceCode}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#14B8A6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-sm text-[#0F172A] tabular-nums focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#14B8A6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-sm text-[#0F172A] tabular-nums focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Mô tả / Ghi chú (tùy chọn)
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú mục tiêu chuyến đi, phong cách du lịch..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={updateTripMutation.isPending}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateTripMutation.isPending}
              className="rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {updateTripMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
