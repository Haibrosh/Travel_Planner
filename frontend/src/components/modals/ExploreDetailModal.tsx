'use client';

import React from 'react';
import { X, MapPin, Plus, ExternalLink, Star, Check } from 'lucide-react';

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
  description?: string | null;
  tags: string[];
  address: string;
  rating?: number | null;
  isVisited?: boolean;
  onToggleVisited?: () => void;
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
  rating,
  isVisited,
  onToggleVisited,
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
        {/* 1. Ảnh bìa */}
        <div className="relative w-full h-[260px] bg-slate-100 overflow-hidden shrink-0">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#64748B] hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Nội dung */}
        <div className="bg-[#F8FAFC] p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
          {/* Tiêu đề, Rating API & Tags */}
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight leading-snug">
                {title}
              </h2>
              {rating != null && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-extrabold text-amber-700 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {rating}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-[#0F766E] text-white text-xs font-bold tracking-wide"
                >
                  {tag}
                </span>
              ))}

              {onToggleVisited && (
                <button
                  type="button"
                  onClick={onToggleVisited}
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                    isVisited
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isVisited ? 'Đã ghé thăm' : 'Đánh dấu đã thăm'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Địa chỉ từ API */}
          <div className="flex items-start gap-2.5 text-xs text-[#334155] bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
            <MapPin className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#0F172A]">Địa chỉ:</span>
              <p className="leading-relaxed text-[#64748B]">
                {address || 'Đang cập nhật địa chỉ'}
              </p>
            </div>
          </div>

          {/* Nội dung Wiki từ DB (nếu có) hoặc mô tả từ API */}
          {content ? (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              {(content.summary || description) && (
                <p className="text-sm text-[#475569] leading-relaxed">
                  {content.summary || description}
                </p>
              )}
              {(content.attribution || content.sourceWikiUrl) && (
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
              )}
            </div>
          ) : description ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              <p className="text-sm text-[#475569] leading-relaxed">{description}</p>
            </div>
          ) : null}

          {/* Nút Hủy & Thêm vào chuyến đi */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                onCancel?.();
                onClose();
              }}
              className="flex-1 h-[44px] rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToTrip?.();
                onClose();
              }}
              className="flex-[2] h-[44px] rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
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