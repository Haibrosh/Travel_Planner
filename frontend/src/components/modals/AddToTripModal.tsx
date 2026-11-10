'use client';

import React, { useMemo, useState } from 'react';
import { X, ChevronDown, MapPin } from 'lucide-react';
import type { TripResponse } from '@/types/trip';
import { useTripUiStore } from '@/store/useTripUiStore';

export interface AddToTripSelection {
  tripId: number;
  tripName: string;
  dayNumber: number;
  dayLabel: string;
}

export interface AddToTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationTitle?: string;
  tripObjects?: TripResponse[];
  trips?: string[];
  dates?: string[];
  isSubmitting?: boolean;
  onSave?: (selectedTrip: string, selectedDate: string) => void;
  onSaveTripDay?: (selection: AddToTripSelection) => void | Promise<void>;
}

interface DayOption {
  dayNumber: number;
  label: string;
}

function buildDayOptionsForTrip(trip?: TripResponse): DayOption[] {
  if (!trip || !trip.startDate || !trip.endDate) {
    return [
      { dayNumber: 1, label: 'Ngày 1' },
      { dayNumber: 2, label: 'Ngày 2' },
      { dayNumber: 3, label: 'Ngày 3' },
    ];
  }

  try {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const options: DayOption[] = [];
    const current = new Date(start);
    let dayNum = 1;

    while (current <= end && dayNum <= 30) {
      const dateStr = current.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      options.push({
        dayNumber: dayNum,
        label: `Ngày ${dayNum} (${dateStr})`,
      });
      current.setDate(current.getDate() + 1);
      dayNum++;
    }

    if (options.length === 0) {
      options.push({ dayNumber: 1, label: `Ngày 1 (${trip.startDate})` });
    }

    return options;
  } catch {
    return [
      { dayNumber: 1, label: 'Ngày 1' },
      { dayNumber: 2, label: 'Ngày 2' },
    ];
  }
}

export const AddToTripModal: React.FC<AddToTripModalProps> = ({
  isOpen,
  onClose,
  locationTitle,
  tripObjects,
  trips = ['Khám phá Vũng Tàu cuối tuần', 'Đà Lạt Săn Mây & Cà Phê Đồi Thông'],
  dates = ['Ngày 1', 'Ngày 2', 'Ngày 3'],
  isSubmitting = false,
  onSave,
  onSaveTripDay,
}) => {
  const {
    selectedTripId: storeTripId,
    selectedDayNumber: storeDayNumber,
    setSelectedTripId,
    setSelectedDayNumber,
  } = useTripUiStore();

  const effectiveTrips: TripResponse[] = useMemo(() => {
    if (tripObjects && tripObjects.length > 0) {
      return tripObjects;
    }
    return trips.map((name, idx) => ({
      tripId: idx + 1,
      ownerId: 1,
      ownerUsername: 'haileader',
      provinceCode: '68',
      name,
      startDate: '2026-11-14',
      endDate: '2026-11-16',
      status: 'PLANNING',
      createdAt: '',
      updatedAt: '',
    }));
  }, [tripObjects, trips]);

  const defaultTripId = useMemo(() => {
    if (storeTripId) {
      const matched = effectiveTrips.find((t) => String(t.tripId) === String(storeTripId));
      if (matched) return matched.tripId;
    }
    return effectiveTrips[0]?.tripId ?? 1;
  }, [effectiveTrips, storeTripId]);

  const [chosenTripId, setChosenTripId] = useState<number | null>(null);
  const [chosenDayValue, setChosenDayValue] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTripId =
    chosenTripId !== null && effectiveTrips.some((t) => t.tripId === chosenTripId)
      ? chosenTripId
      : defaultTripId;

  const selectedTripObj =
    effectiveTrips.find((t) => t.tripId === activeTripId) ?? effectiveTrips[0];

  const dayOptions: DayOption[] =
    tripObjects && tripObjects.length > 0
      ? buildDayOptionsForTrip(selectedTripObj)
      : dates.map((d, idx) => ({
          dayNumber: idx + 1,
          label: d.startsWith('Ngày') ? d : `Ngày ${idx + 1} (${d})`,
        }));

  const defaultDayValue = dayOptions.some((o) => o.dayNumber === storeDayNumber)
    ? String(storeDayNumber)
    : String(dayOptions[0]?.dayNumber ?? 1);

  const activeDayValue =
    chosenDayValue !== null &&
    dayOptions.some((o) => String(o.dayNumber) === chosenDayValue)
      ? chosenDayValue
      : defaultDayValue;

  const handleSubmit = async () => {
    const parsedDayNumber = Math.max(1, Number(activeDayValue || 1));
    const chosenOption =
      dayOptions.find((o) => o.dayNumber === parsedDayNumber) ?? dayOptions[0];

    const tripName = selectedTripObj?.name ?? trips[0] ?? 'Chuyến đi của tôi';
    const tripId = selectedTripObj?.tripId ?? 1;

    // Cập nhật store ngày & chuyến đi đang chọn
    setSelectedTripId(String(tripId));
    setSelectedDayNumber(parsedDayNumber);

    if (onSaveTripDay) {
      await onSaveTripDay({
        tripId,
        tripName,
        dayNumber: parsedDayNumber,
        dayLabel: chosenOption?.label ?? `Ngày ${parsedDayNumber}`,
      });
    } else {
      onSave?.(tripName, chosenOption?.label ?? String(parsedDayNumber));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* 1. Header: Tiêu đề & Nút đóng */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
            Thêm vào chuyến đi
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Body: Các trường lựa chọn */}
        <div className="p-6 space-y-5">
          {locationTitle && (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50/70 border border-teal-200/70 px-3.5 py-2.5 text-xs font-bold text-teal-900">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{locationTitle}</span>
            </div>
          )}

          {/* Trường 1: Chọn chuyến đi */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-[#0F172A] whitespace-nowrap">
              Chọn chuyến đi
            </span>
            <div className="relative w-[220px]">
              <select
                value={activeTripId}
                onChange={(e) => {
                  setChosenTripId(Number(e.target.value));
                  setChosenDayValue('1');
                }}
                disabled={isSubmitting}
                className="w-full h-[40px] px-3.5 pr-8 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] appearance-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] cursor-pointer"
              >
                {effectiveTrips.map((trip) => (
                  <option key={trip.tripId} value={trip.tripId}>
                    {trip.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#64748B]">
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Trường 2: Chọn ngày trong lịch trình */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-[#0F172A] whitespace-nowrap">
              Chọn ngày trong lịch trình
            </span>
            <div className="relative w-[170px]">
              <select
                value={activeDayValue}
                onChange={(e) => setChosenDayValue(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-[40px] px-3.5 pr-8 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] appearance-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] cursor-pointer"
              >
                {dayOptions.map((opt) => (
                  <option key={opt.dayNumber} value={String(opt.dayNumber)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#64748B]">
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer: Nút Lưu vào lịch trình */}
        <div className="px-6 pb-6 pt-2 flex justify-center">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full h-[44px] rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu vào lịch trình...' : 'Lưu vào lịch trình'}
          </button>
        </div>
      </div>
    </div>
  );
};
