'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

export interface MapMarker {
  id: string | number;
  number: number;
  top: string;
  left: string;
  title?: string;
}

export interface MapWorkspacePanelProps {
  onSearchChange?: (keyword: string) => void;
  markers?: MapMarker[];
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
}

export const MapWorkspacePanel: React.FC<MapWorkspacePanelProps> = ({
  onSearchChange,
  markers = [
    { id: 1, number: 1, top: '45%', left: '60%' },
    { id: 2, number: 2, top: '28%', left: '62%' },
  ],
  onZoomIn,
  onZoomOut,
  onLocate,
}) => {
  const [mapSearch, setMapSearch] = useState('');

  return (
    /* Bỏ hoàn toàn rounded-2xl để map không bị bo góc, chiếm full khung */
    <div className="relative w-full h-screen bg-slate-100 overflow-hidden flex flex-col">
      
      {/* 1. Khung nền Bản đồ */}
      <div className="absolute inset-0 bg-[#E8F5E9] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=80"
          alt="Map Background"
          className="w-full h-full object-cover opacity-75 filter saturate-125"
        />
        
        {/* Các ghim đánh dấu địa điểm */}
        {markers.map((marker, index) => (
          <div
            key={marker.id || index}
            style={{ top: marker.top, left: marker.left }}
            className="absolute z-10 flex items-center justify-center w-7 h-7 rounded-full bg-[#14B8A6] text-white font-extrabold text-xs shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform"
            title={marker.title}
          >
            {marker.number}
          </div>
        ))}
      </div>

      {/* 2. Thanh tìm kiếm trên bản đồ (Góc trên) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-25 w-full max-w-[340px] px-4">
        <div className="relative flex items-center shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200/80">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={mapSearch}
            onChange={(e) => {
              setMapSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            placeholder="Tìm kiếm tên đường, tòa nhà..."
            className="w-full h-[46px] pl-11 pr-4 bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder:font-normal"
          />
        </div>
      </div>

      {/* 3. Cụm điều hướng (Đẩy cách mép phải và dưới an toàn để không bị khuất) */}
      <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-4">
        
        {/* Nút định vị */}
        <button
          type="button"
          onClick={onLocate}
          className="w-[42px] h-[42px] bg-white rounded-xl shadow-[0_8px_24px_rgba(7,61,53,0.15)] hover:bg-slate-50 text-[#0F766E] flex items-center justify-center transition-all cursor-pointer"
          title="Định vị"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M3 12h2m14 0h2m-4.5 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-4.5-2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </button>

        {/* Cụm Zoom (+ / -) */}
        <div className="w-[42px] h-[84px] bg-white rounded-xl shadow-[0_8px_24px_rgba(7,61,53,0.15)] flex flex-col items-center justify-between py-2">
          <button
            type="button"
            onClick={onZoomIn}
            className="w-full flex items-center justify-center text-[#0F766E] hover:opacity-80 transition-opacity cursor-pointer"
            title="Phóng to"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          <div className="w-6 h-[1px] bg-slate-100" />

          <button
            type="button"
            onClick={onZoomOut}
            className="w-full flex items-center justify-center text-[#0F766E] hover:opacity-80 transition-opacity cursor-pointer"
            title="Thu nhỏ"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
        </div>

      </div>

    </div>
  );
};