'use client';

import { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Chỉnh sửa chuyến đi
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cập nhật thông tin hành trình của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tên chuyến đi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="VD: Khám phá Đà Lạt mộng mơ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Điểm đến chính <span className="text-red-500">*</span>
            </label>
            <select
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {destinationOptions.map((d) => (
                <option key={d.provinceCode} value={d.provinceCode}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mô tả / Ghi chú (tùy chọn)
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú mục tiêu chuyến đi, phong cách du lịch..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={updateTripMutation.isPending}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateTripMutation.isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {updateTripMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
