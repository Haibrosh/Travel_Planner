'use client';

import React from 'react';
import {
  X,
  Star,
  MapPin,
  Check,
  Navigation,
  Clock,
  Phone,
  Globe,
  Plus,
  Tag,
} from 'lucide-react';
import { usePlaceDetail } from '@/hooks/usePlaces';

export interface PlaceDetailData {
  id: string | number;
  title: string;
  category: string;
  subcategory?: string | null;
  address?: string;
  rating?: number;
  reviewCount?: number | null;
  imageUrl?: string;
  description?: string | null;
  openingHours?: string | null;
  phone?: string | null;
  website?: string | null;
  price?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isVisited?: boolean;
}

export interface PlaceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: PlaceDetailData | null;
  onToggleVisited?: (id: string | number) => void;
  onAddToTrip?: (place: PlaceDetailData) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  isOpen,
  onClose,
  place,
  onToggleVisited,
  onAddToTrip,
}) => {
  const { data: fetchedPlace, isLoading } = usePlaceDetail(
    isOpen && place?.id ? place.id : null
  );

  if (!isOpen || !place) return null;

  const displayTitle = fetchedPlace?.name || place.title;
  const displayCategory =
    fetchedPlace?.subcategory || fetchedPlace?. tags?.[0] || place.category;
  const displayAddress =
    fetchedPlace?.address || place.address || 'Đà Lạt, Lâm Đồng, Việt Nam';
  const displayRating = fetchedPlace?.rating ?? place.rating;
  const displayReviews = fetchedPlace?.reviewCount ?? place.reviewCount;
  const displayImage =
    fetchedPlace?.photoUrl ||
    place.imageUrl ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
  const displayDescription = fetchedPlace?.description ?? place.description;
  const displayHours = fetchedPlace?.openingHours ?? place.openingHours;
  const displayPhone = fetchedPlace?.phone ?? place.phone;
  const displayWebsite = fetchedPlace?.website ?? place.website;
  const displayPrice = fetchedPlace?.price ?? place.price;
  const lat = fetchedPlace?.latitude ?? place.latitude;
  const lng = fetchedPlace?.longitude ?? place.longitude;

  const mapsQuery =
    lat !== null && lat !== undefined && lng !== null && lng !== undefined
      ? `${lat},${lng}`
      : `${displayTitle} ${displayAddress}`;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] max-w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
      {/* 1. Header ảnh & Nút đóng */}
      <div className="relative w-full h-[175px] bg-slate-100">
        <img
          src={displayImage}
          alt={displayTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold bg-teal-600 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wide">
              {displayCategory}
            </span>
            {displayPrice && (
              <span className="text-[10px] font-bold bg-white/90 text-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Tag className="w-3 h-3 text-teal-600" />
                {displayPrice}
              </span>
            )}
          </div>
          <h3 className="text-base font-extrabold text-white mt-1.5 truncate drop-shadow-sm">
            {displayTitle}
          </h3>
        </div>
      </div>

      {/* 2. Nội dung chi tiết */}
      <div className="p-4 flex flex-col gap-3">
        {isLoading && (
          <div className="h-1 w-full bg-slate-100 overflow-hidden rounded-full">
            <div className="h-full w-1/2 bg-teal-500 animate-pulse rounded-full" />
          </div>
        )}

        {/* Đánh giá & Mô tả */}
        <div className="flex flex-col gap-2 text-xs">
          {displayRating && (
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-amber-500 font-extrabold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {displayRating}
              </span>
              <span className="text-slate-400 font-medium">
                {displayReviews
                  ? `(${displayReviews.toLocaleString('vi-VN')} đánh giá)`
                  : 'Google Maps Rating'}
              </span>
            </div>
          )}

          {displayDescription && (
            <p className="text-slate-600 leading-relaxed line-clamp-2">
              {displayDescription}
            </p>
          )}

          <div className="flex items-start gap-2 text-slate-600 font-medium pt-0.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{displayAddress}</span>
          </div>

          {displayHours && (
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{displayHours}</span>
            </div>
          )}

          {(displayPhone || displayWebsite) && (
            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-slate-600">
              {displayPhone && (
                <a
                  href={`tel:${displayPhone}`}
                  className="inline-flex items-center gap-1 hover:text-teal-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>{displayPhone}</span>
                </a>
              )}
              {displayWebsite && (
                <a
                  href={displayWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-600 hover:underline font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onToggleVisited?.(place.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              place.isVisited
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
                    title: displayTitle,
                    address: displayAddress,
                    rating: displayRating ?? undefined,
                    imageUrl: displayImage,
                  })
                }
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vào lịch</span>
              </button>
            )}

            <a
              href={`https://google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
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
