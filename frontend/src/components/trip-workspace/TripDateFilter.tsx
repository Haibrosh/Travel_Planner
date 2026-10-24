'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface TripDateFilterProps {
  currentDate: string;
  onDateChange?: (date: string) => void;
}

export const TripDateFilter: React.FC<TripDateFilterProps> = ({ currentDate }) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
        LỊCH TRÌNH
      </h2>
      <div className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] shadow-xs cursor-pointer hover:bg-slate-50 transition-all">
          <Calendar className="w-4 h-4 text-[#14B8A6]" />
          <span>{currentDate}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
        </div>
      </div>
    </div>
  );
};