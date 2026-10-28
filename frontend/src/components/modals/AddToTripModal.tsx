'use client';

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface AddToTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationTitle?: string;
  trips?: string[];
  dates?: string[];
  onSave?: (selectedTrip: string, selectedDate: string) => void;
}

export const AddToTripModal: React.FC<AddToTripModalProps> = ({
  isOpen,
  onClose,
  trips = ['ĐÀ LẠT MỘNG MƠ', 'Hà Nội 3 Ngày 2 Đêm', 'Phú Quốc Hè 2026'],
  dates = ['7/11', '8/11', '9/11'],
  onSave,
}) => {
  const [selectedTrip, setSelectedTrip] = useState(trips[0]);
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      {/* Khung Modal bám sát kích thước mẫu (khoảng 397px) */}
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="relative w-full max-w-[397px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        
        {/* 1. Header: Tiêu đề & Nút đóng */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
            Thêm vào chuyến đi
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Body: Các trường lựa chọn */}
        <div className="p-6 space-y-5">
          
          {/* Trường 1: Chọn chuyến đi */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-[#0F172A] whitespace-nowrap">
              Chọn chuyến đi
            </span>
            <div className="relative w-[210px]">
              <select
                value={selectedTrip}
                onChange={(e) => setSelectedTrip(e.target.value)}
                className="w-full h-[40px] px-3.5 pr-8 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] appearance-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] cursor-pointer"
              >
                {trips.map((trip, idx) => (
                  <option key={idx} value={trip}>
                    {trip}
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
            <div className="relative w-[110px]">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-[40px] px-3.5 pr-8 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] appearance-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] cursor-pointer"
              >
                {dates.map((date, idx) => (
                  <option key={idx} value={date}>
                    {date}
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
            onClick={() => {
              onSave?.(selectedTrip, selectedDate);
              onClose();
            }}
            className="w-full h-[44px] rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center active:scale-98"
          >
            Lưu vào lịch trình
          </button>
        </div>

      </div>
    </div>
  );
};