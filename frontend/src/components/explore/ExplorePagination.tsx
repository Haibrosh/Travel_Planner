'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ExplorePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ExplorePagination: React.FC<ExplorePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Trước</span>
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onPageChange(num)}
          className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs ${
            currentPage === num
              ? 'bg-teal-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {num}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
      >
        <span>Sau</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};