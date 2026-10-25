'use client';

import React from 'react';
import { X, Star, MapPin, Check, ExternalLink, Navigation } from 'lucide-react';

export interface PlaceDetailData {
  id: string | number;
  title: string;
  category: string;
  address?: string;
  rating?: number;
  imageUrl?: string;
  isVisited?: boolean;
}

export interface PlaceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: PlaceDetailData | null;
  onToggleVisited?: (id: string | number) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  isOpen,
  onClose,
  place,
  onToggleVisited,
}) => {
  if (!isOpen || !place) return null;

  return (
    <div 
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="absolute bottom-6 right-6 z-30 w-full max-w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
      {/* 1. Header ảnh & Nút đóng */}
      <div className="relative w-full h-[160px] bg-slate-100">
        <img
          src={place.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'}
          alt={place.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <span className="text-[10px] font-extrabold bg-teal-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wide">
            {place.category}
          </span>
          <h3 className="text-base font-extrabold text-white mt-1 truncate drop-shadow-sm">
            {place.title}
          </h3>
        </div>
      </div>

      {/* 2. Nội dung chi tiết */}
      <div className="p-4 flex flex-col gap-3.5">
        
        {/* Đánh giá & Địa chỉ */}
        <div className="flex flex-col gap-1.5 text-xs">
          {place.rating && (
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-amber-500 font-extrabold flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {place.rating}
              </span>
              <span className="text-slate-400 font-medium">Google Maps Rating</span>
            </div>
          )}
          <div className="flex items-start gap-1.5 text-slate-600 font-medium">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{place.address || 'Đà Lạt, Lâm Đồng, Việt Nam'}</span>
          </div>
        </div>

        {/* Nút Đã ghé thăm / Đánh dấu */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
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

          <a
            href={`https://google.com/maps/search/?q=${encodeURIComponent(place.title)}`}
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
  );
};