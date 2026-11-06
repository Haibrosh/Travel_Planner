'use client';

import React from 'react';
import { X, MapPin, Plus, ExternalLink } from 'lucide-react';

export interface WikiContent {
  summary: string;
  attribution?: string;
  sourceWikiUrl?: string;
}

export interface ExploreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
  description: string;
  tags: string[];
  address: string;
  content?: WikiContent | null;
  onCancel?: () => void;
  onAddToTrip?: () => void;
}

export const ExploreDetailModal: React.FC<ExploreDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  imageUrl,
  description,
  tags,
  address,
  content,
  onCancel,
  onAddToTrip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="relative w-full max-w-[500px] bg-[#F8FAFC] rounded-[16px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/60 animate-in zoom-in-95 duration-200"
      >
        {/* 1. Phần ảnh bìa phía trên */}
        <div className="relative w-full h-[280px] bg-slate-100 overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#64748B] hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Phần nội dung */}
        <div className="bg-[#F8FAFC] p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-5">
          {/* Tiêu đề & Tags */}
          <div className="space-y-3">
            <h2 className="text-[24px] font-extrabold text-[#0F172A] tracking-tight leading-snug">
              {title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-[#0F766E] text-white text-xs font-bold tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Địa chỉ chi tiết */}
          <div className="flex items-start gap-2.5 text-xs text-[#334155] bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
            <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#0F172A]">Địa chỉ:</span>
              <p className="leading-relaxed text-[#64748B]">{address}</p>
            </div>
          </div>

          {/* Phần Wiki Content từ DB (Chỉ hiển thị khi content != null) */}
          {content ? (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              <p className="text-sm text-[#475569] leading-relaxed">{content.summary || description}</p>
              
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                {content.attribution && <span>{content.attribution}</span>}
                {content.sourceWikiUrl && (
                  <a
                    href={content.sourceWikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-teal-600 hover:underline"
                  >
                    <span>Xem bài gốc trên Wiki</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            description && <p className="text-sm text-[#475569] leading-relaxed">{description}</p>
          )}

          {/* Nút Hủy & Thêm vào chuyến đi */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onCancel?.();
                onClose();
              }}
              className="flex-1 h-[44px] rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold transition-all flex items-center justify-center shadow-xs active:scale-98 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToTrip?.();
                onClose();
              }}
              className="flex-[2] h-[44px] rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Thêm vào chuyến đi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};