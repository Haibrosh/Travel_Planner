'use client';

import React from 'react';
import { X, Star, MapPin, Check, Navigation, ExternalLink } from 'lucide-react';
import { usePlaceDetail } from '@/hooks/usePlaces';
import { getPlaceFallbackImage } from '@/services/explore.service';
import type { PlaceContent } from '@/types/explore';

export interface PlaceDetailData {
  id: string | number;
  title: string;
  category?: string;
  address?: string;
  rating?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasContent?: boolean;
  content?: PlaceContent | null;
  isVisited?: boolean;
}

export interface PlaceDetailModalProps {
  place: PlaceDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleVisited?: (placeId: string | number) => void;
  onAddToTrip?: (place: PlaceDetailData) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  isOpen,
  onClose,
  onToggleVisited,
  onAddToTrip,
}) => {
  const numericId = place?.id != null ? Number(place.id) : null;
  const { data: detail, isLoading } = usePlaceDetail(
    isOpen && numericId && !Number.isNaN(numericId) ? numericId : null
  );

  if (!isOpen || !place) return null;

  const title = detail?.name || place.title;
  const category = detail?.category || place.category || 'Khám phá';
  const address = detail?.address ?? place.address ?? '';
  const rating = detail?.rating !== undefined ? detail.rating : place.rating;
  const description = detail?.description ?? place.description ?? null;
  const imageUrl =
    detail?.photoUrl ||
    place.imageUrl ||
    getPlaceFallbackImage(category) ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
  const wikiData: PlaceContent | null = detail?.content ?? place.content ?? null;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
      {/* 1. Header ảnh & Nút đóng */}
      <div className="relative w-full h-[165px] bg-slate-100 shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold bg-teal-600 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wide">
              {category}
            </span>
          </div>
          <h3 className="mt-1 text-base font-extrabold text-white leading-snug line-clamp-2">
            {title}
          </h3>
        </div>
      </div>

      {/* 2. Nội dung chi tiết */}
      <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {isLoading && (
          <div className="h-1 w-full bg-slate-100 overflow-hidden rounded-full">
            <div className="h-full w-1/2 bg-teal-500 animate-pulse" />
          </div>
        )}

        {/* Đánh giá & Địa chỉ */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            {rating != null ? (
              <span className="text-amber-500 font-extrabold inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                {rating}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                <Star className="w-3.5 h-3.5 text-slate-300" />
                Chưa có đánh giá
              </span>
            )}
          </div>

          {address && (
            <div className="flex items-start gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{address}</span>
            </div>
          )}
        </div>

        {/* Mô tả từ API (nếu có) */}
        {description && (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {description}
          </p>
        )}

        {/* Nội dung Wiki từ API (chỉ hiển thị khi có dữ liệu) */}
        {wikiData &&
          (wikiData.summary || wikiData.attribution || wikiData.sourceWikiUrl) && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              {wikiData.summary && (
                <p className="text-slate-600 leading-relaxed">{wikiData.summary}</p>
              )}
              {(wikiData.attribution || wikiData.sourceWikiUrl) && (
                <div className="pt-1.5 border-t border-slate-200/60 flex flex-col gap-1 text-[10px] text-slate-400">
                  {wikiData.attribution && <span>{wikiData.attribution}</span>}
                  {wikiData.sourceWikiUrl && (
                    <a
                      href={wikiData.sourceWikiUrl}
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
          )}

        {/* Nút hành động */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onToggleVisited?.(place.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
              place.isVisited
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{place.isVisited ? 'Đã ghé thăm' : 'Đánh dấu đã ghé'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {onAddToTrip && (
              <button
                type="button"
                onClick={() =>
                  onAddToTrip({
                    ...place,
                    id: place.id,
                    title,
                    category,
                    address,
                    rating,
                    description,
                    imageUrl,
                    content: wikiData,
                  })
                }
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                + Lịch trình
              </button>
            )}

            <a
              href={`https://google.com/maps/search/?q=${encodeURIComponent(
                address ? `${title} ${address}` : title
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Chỉ đường</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};