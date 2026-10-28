'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Plus } from 'lucide-react';

export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
}

export interface AddLocationBarProps {
  onSelectLocation?: (location: LocationSuggestion) => void;
}

// Dữ liệu mẫu gợi ý địa điểm (Sau này có thể kết nối API tìm kiếm backend)
const MOCK_SUGGESTIONS: LocationSuggestion[] = [
  { id: '1', name: 'Nhà thờ Con Gà', address: '15 Trần Phú, Phường 3, Đà Lạt' },
  { id: '2', name: 'Đồi Chè Cầu Đất', address: 'Cầu Đất, Trạm Hành, Đà Lạt' },
  { id: '3', name: 'Thung Lũng Tình Yêu', address: '05 Mai Anh Đào, Phường 8, Đà Lạt' },
  { id: '4', name: 'Ga Đà Lạt', address: 'Quang Trung, Phường 10, Đà Lạt' },
];

export const AddLocationBar: React.FC<AddLocationBarProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Lọc danh sách theo từ khóa gõ vào
  const filteredSuggestions = MOCK_SUGGESTIONS.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.address.toLowerCase().includes(query.toLowerCase())
  );

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      
      {/* 1. Thanh Input tìm kiếm */}
      <div className="relative flex items-center w-full h-[48px] bg-[#64748B]/10 hover:bg-[#64748B]/15 border border-slate-200 rounded-2xl px-4 transition-all">
        <div className="text-[#64748B] mr-3 flex-shrink-0">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Thêm địa điểm..."
          className="w-full bg-transparent text-xs font-bold text-[#0F172A] placeholder:text-[#64748B] focus:outline-none"
        />
      </div>

      {/* 2. Danh sách Dropdown xổ xuống khi gõ hoặc focus */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[260px] overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            <div className="py-2">
              {filteredSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectLocation?.(item);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer border-b border-slate-50 last:border-none group"
                >
                  <MapPin className="w-4 h-4 text-[#14B8A6] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-[#0F172A] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{item.address}</p>
                  </div>
                  <div className="text-[#14B8A6] opacity-0 group-hover:opacity-100 transition-opacity flex items-center self-center">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
              Không tìm thấy địa điểm phù hợp
            </div>
          )}
        </div>
      )}

    </div>
  );
};