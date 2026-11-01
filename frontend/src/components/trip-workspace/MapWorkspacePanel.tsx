'use client';

import React, { useState } from 'react';
import { Search, Plus, Minus, Layers, Navigation } from 'lucide-react';
import { PlaceDetailModal } from '@/components/modals/PlaceDetailModal';
import { useMapStore } from '@/store/useMapStore';

export interface MapPinItem {
  id: string | number;
  index: number;
  title: string;
  category: string;
  address?: string;
  rating?: number;
  imageUrl?: string;
  isVisited?: boolean;
  top: string;
  left: string;
}

export interface MapWorkspacePanelProps {
  pins?: MapPinItem[];
}

export const MapWorkspacePanel: React.FC<MapWorkspacePanelProps> = ({ pins = [] }) => {
  const [, setZoom] = useState(14);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mapLayer, setMapLayer] = useState<'default' | 'satellite' | 'terrain'>('default');

  // Đọc state và actions trực tiếp từ useMapStore
  const { selectedPlace, isModalOpen, openModal, closeModal, toggleVisited } = useMapStore();

  return (
    <div 
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="relative w-full h-full bg-[#E5E3DF] overflow-hidden select-none"
    >
      {/* 1. Lớp hình nền bản đồ */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-300 ${
          mapLayer === 'satellite' ? 'filter brightness-75 contrast-125' : 'filter saturate-90 opacity-90'
        }`}
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1600&q=80')`,
        }}
      />
      
      <div className="absolute inset-0 bg-slate-900/5 pointer-events-none" />

      {/* 2. Thanh tìm kiếm */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-[420px] bg-white/95 rounded-2xl shadow-lg border border-slate-200/80 px-4 py-2.5 flex items-center gap-3 backdrop-blur-md pointer-events-auto">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tên đường, tòa nhà..."
            className="w-full text-xs font-bold text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* 3. Cụm nút công cụ phía dưới bên phải */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col items-end gap-2">
        {showLayerMenu && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 mb-1 flex flex-col gap-1 w-36 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => { setMapLayer('default'); setShowLayerMenu(false); }}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${mapLayer === 'default' ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              Mặc định
            </button>
            <button
              type="button"
              onClick={() => { setMapLayer('satellite'); setShowLayerMenu(false); }}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${mapLayer === 'satellite' ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              Vệ tinh
            </button>
            <button
              type="button"
              onClick={() => { setMapLayer('terrain'); setShowLayerMenu(false); }}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${mapLayer === 'terrain' ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              Địa hình
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Lớp bản đồ"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => alert('Đang định vị vị trí của bạn...')}
          className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-teal-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Vị trí của tôi"
        >
          <Navigation className="w-4 h-4" />
        </button>

        <div className="bg-white rounded-full shadow-md border border-slate-200/80 overflow-hidden flex flex-col mt-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 1, 20))}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100"
            title="Phóng to"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 1, 1))}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 4. Các Ghim vị trí (Map Pins) - Chỉ hiển thị số, phóng to và đổi sang màu Teal đậm khi chọn */}
      {pins.map((pin) => {
        const isSelected = selectedPlace?.id === pin.id;
        return (
          <div
            key={pin.id}
            onClick={() => openModal({
              id: pin.id,
              title: pin.title,
              category: pin.category,
              address: pin.address,
              rating: pin.rating,
              imageUrl: pin.imageUrl,
              isVisited: pin.isVisited,
            })}
            style={{ top: pin.top, left: pin.left }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-[#0F766E] ring-4 ring-teal-300/60 scale-125 z-20' // Phóng to và đổi sang Teal đậm, không dùng màu đỏ
                  : 'bg-teal-600 hover:bg-teal-500 group-hover:scale-110'
              }`}
            >
              {pin.index}
            </div>
          </div>
        );
      })}

      {/* 5. Modal Chi tiết Địa điểm đọc từ store */}
      <PlaceDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        place={selectedPlace}
        onToggleVisited={toggleVisited}
      />
    </div>
  );
};