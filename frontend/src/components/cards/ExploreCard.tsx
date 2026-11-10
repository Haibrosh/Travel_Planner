'use client';

import React from 'react';
import { MapPin, Plus, Star, BookOpen } from 'lucide-react';
import { getPlaceFallbackImage } from '@/services/explore.service';

export interface ExploreCardProps {
  id: string | number;
  title: string;
  imageUrl: string;
  category?: string;
  rating?: number | null;
  reviewCount?: number | null;
  hasContent?: boolean;
  tags: string[];
  address: string;
  onAddToTrip?: (id: string | number) => void;
  onClick?: (id: string | number) => void;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({
  id,
  title,
  imageUrl,
  category = 'attraction',
  rating,
  reviewCount,
  hasContent,
  tags,
  address,
  onAddToTrip,
  onClick,
}) => {
  const fallbackImg = getPlaceFallbackImage(category);
  const hasValidRating =
    rating !== null && rating !== undefined && !Number.isNaN(Number(rating));

  return (
    <div
      onClick={() => onClick?.(id)}
      style={{
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.06)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      className="relative w-full rounded-[22px] border border-[#E2E8F0] bg-white overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col"
    >
      {/* 1. Phần ảnh bìa phía trên */}
      <div className="relative w-full h-[180px] overflow-hidden flex-shrink-0 bg-slate-100">
        <img
          src={imageUrl || fallbackImg}
          alt={title}
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src !== fallbackImg) {
              e.currentTarget.src = fallbackImg;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badge Đánh giá trên góc ảnh */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {hasValidRating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-extrabold text-slate-900 shadow-xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(rating).toFixed(1)}
              {reviewCount ? (
                <span className="text-[10px] font-medium text-slate-500">
                  ({reviewCount.toLocaleString('vi-VN')})
                </span>
              ) : null}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-900/75 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold text-white shadow-xs">
              Chưa có đánh giá
            </span>
          )}
        </div>

        {/* Badge có bài giới thiệu Wiki (nếu có) */}
        {hasContent && (
          <div className="absolute top-3 right-3">
            <span
              title="Có bài giới thiệu Wikipedia / Wikidata"
              className="inline-flex items-center gap-1 rounded-full bg-teal-600/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
            >
              <BookOpen className="w-3 h-3" />
              Wiki
            </span>
          </div>
        )}
      </div>

      {/* 2. Phần nội dung phía dưới */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Tiêu đề & Danh mục tags */}
        <div className="space-y-2.5">
          <h3 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight truncate">
            {title}
          </h3>

          {/* Danh mục tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-[#0F766E] text-white text-[11px] font-bold tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Địa chỉ chi tiết */}
        <div className="flex items-start gap-2 text-xs text-[#64748B]">
          <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-relaxed">{address}</span>
        </div>

        {/* Nút hành động: + Thêm vào chuyến đi */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToTrip?.(id);
            }}
            className="w-full h-[40px] rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Thêm vào chuyến đi
          </button>
        </div>
      </div>
    </div>
  );
};
