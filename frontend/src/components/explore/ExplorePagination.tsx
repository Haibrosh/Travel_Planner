'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ExplorePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    'ellipsis-start',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-end',
    totalPages,
  ];
}

export const ExplorePagination: React.FC<ExplorePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const pageTokens = useMemo(
    () => buildPageTokens(safeCurrentPage, safeTotalPages),
    [safeCurrentPage, safeTotalPages]
  );

  if (safeTotalPages <= 1) return null;

  const handleSelectPage = (page: number) => {
    if (page < 1 || page > safeTotalPages || page === safeCurrentPage) return;
    onPageChange(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Phân trang danh sách địa điểm"
      className="flex flex-col items-center gap-3 py-6"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full">
        <button
          type="button"
          disabled={safeCurrentPage === 1}
          onClick={() => handleSelectPage(safeCurrentPage - 1)}
          className="px-3.5 h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Trước</span>
        </button>

        {pageTokens.map((token) => {
          if (token === 'ellipsis-start' || token === 'ellipsis-end') {
            return (
              <span
                key={token}
                aria-hidden="true"
                className="w-8 h-9 inline-flex items-center justify-center text-xs font-bold text-slate-400 select-none"
              >
                ...
              </span>
            );
          }

          const isActive = safeCurrentPage === token;
          return (
            <button
              key={token}
              type="button"
              onClick={() => handleSelectPage(token)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-9 h-9 px-2.5 rounded-xl text-xs font-extrabold tabular-nums transition-all cursor-pointer shadow-xs ${
                isActive
                  ? 'bg-[#0F766E] text-white border border-[#0F766E]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-teal-400'
              }`}
            >
              {token.toLocaleString('vi-VN')}
            </button>
          );
        })}

        <button
          type="button"
          disabled={safeCurrentPage === safeTotalPages}
          onClick={() => handleSelectPage(safeCurrentPage + 1)}
          className="px-3.5 h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <span>Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-semibold text-slate-500 tabular-nums">
        Trang{' '}
        <span className="font-extrabold text-[#0F172A]">
          {safeCurrentPage.toLocaleString('vi-VN')}
        </span>{' '}
        / {safeTotalPages.toLocaleString('vi-VN')}
      </p>
    </nav>
  );
};