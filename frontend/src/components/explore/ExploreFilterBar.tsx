'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';

export interface ExploreFilterBarProps {
  selectedProvince: string;
  onSelectProvince: (province: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  provincesList: string[];
}

export const ExploreFilterBar: React.FC<ExploreFilterBarProps> = ({
  selectedProvince,
  onSelectProvince,
  searchQuery,
  onSearchChange,
  provincesList,
}) => {
  const [provinceInput, setProvinceInput] = useState<string>(selectedProvince === '' ? '' : selectedProvince);
  const [isProvinceOpen, setIsProvinceOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredProvinces = provincesList.filter((p: string) =>
    p.toLowerCase().includes(provinceInput.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProvinceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="w-full max-w-[800px] mx-auto bg-white border border-[#64748B]/30 rounded-[12px] p-2 flex flex-col md:flex-row items-center gap-1 shadow-2xs relative"
    >
      
      {/* 1. Phần chọn/tìm Tỉnh Thành  */}
      <div className="relative w-full md:w-[40%] h-[42px] px-3 flex items-center justify-between" ref={dropdownRef}>
        <div className="flex items-center gap-2.5 min-w-0 w-full">
          <MapPin className="w-4 h-4 text-[#14B8A6] shrink-0 stroke-[2]" />
          <input
            type="text"
            value={provinceInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setProvinceInput(e.target.value);
              setIsProvinceOpen(true);
            }}
            onClick={() => setIsProvinceOpen(true)}
            placeholder="Chọn tỉnh thành"
            style={{ fontSize: '16px', fontWeight: 400 }}
            className="w-full text-[#0F172A] bg-transparent outline-none truncate placeholder-[#64748B] cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[#64748B]">
          {provinceInput && (
            <X 
              className="w-3.5 h-3.5 hover:text-[#0F172A] cursor-pointer" 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setProvinceInput('');
                onSelectProvince('');
              }} 
            />
          )}
          <ChevronDown className="w-4 h-4 cursor-pointer stroke-[2]" onClick={() => setIsProvinceOpen(!isProvinceOpen)} />
        </div>

        {/* Dropdown danh sách tỉnh thành xổ xuống */}
        {isProvinceOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-50 p-1 custom-scrollbar">
            {filteredProvinces.length > 0 ? (
              filteredProvinces.map((prov: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => {
                    const val = prov === 'Tất cả tỉnh thành' ? '' : prov;
                    setProvinceInput(val);
                    onSelectProvince(val);
                    setIsProvinceOpen(false);
                  }}
                  style={{ fontSize: '15px', fontWeight: 400 }}
                  className="px-3.5 py-2.5 text-[#0F172A] hover:bg-teal-50 hover:text-teal-700 rounded-lg cursor-pointer transition-colors"
                >
                  {prov}
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-slate-400 text-center font-medium">
                Không tìm thấy tỉnh thành phù hợp
              </div>
            )}
          </div>
        )}
      </div>

      {/* Đường phân cách giữa 2 phần */}
      <div className="hidden md:block w-[1px] h-6 bg-[#64748B]/20 my-auto" />

      {/* 2. Phần tìm kiếm từ khóa địa điểm (~60%) */}
      <div className="relative w-full md:w-[60%] h-[42px] px-3 flex items-center">
        <Search className="w-4 h-4 text-[#64748B] shrink-0 mr-2.5 stroke-[2]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm địa điểm, quán ăn, khách sạn..."
          style={{ fontSize: '14px', fontWeight: 400 }}
          className="w-full text-[#0F172A] bg-transparent outline-none placeholder-[#64748B]"
        />
      </div>

    </div>
  );
};