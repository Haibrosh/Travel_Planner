'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Camera } from 'lucide-react';

export interface NewTripFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
}

export interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewTripFormData) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Khóa cuộn trang khi modal mở & lắng nghe phím ESC để đóng
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên chuyến đi!');
      return;
    }

    // Truyền dữ liệu thực tế người dùng nhập/chọn (không gán cứng link ảnh ngoài ý muốn)
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate,
      imageUrl: previewImage || imageUrl || '',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setPreviewImage(null);
    setImageUrl('');
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setPreviewImage(tempUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 1. Lớp phủ đen mờ hậu cảnh (Backdrop) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* 2. Hộp thoại Modal */}
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="relative z-10 w-full max-w-[500px] bg-[#F8FAFC] rounded-[20px] shadow-2xl overflow-hidden border border-slate-200/60 animate-in zoom-in-95 duration-200"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200">
          <h3 className="text-[17px] font-extrabold text-[#0F172A] uppercase tracking-wide">
            Tạo chuyến đi mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Nội dung Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          
          {/* Trường 1: Tên chuyến đi */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Tên chuyến đi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đà Lạt mộng mơ..."
              className="w-full h-[36px] px-3.5 text-sm bg-white border border-[#E2E8F0] rounded-[8px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-all"
            />
          </div>

          {/* Trường 2: Mô tả */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm mô tả cho chuyến đi của bạn..."
              className="w-full h-[74px] p-3 text-sm bg-white border border-[#E2E8F0] rounded-[8px] text-[#0F172A] placeholder-[#94A3B8] resize-none focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-all"
            />
          </div>

          {/* Trường 3: Thời gian (Ngày bắt đầu & Ngày kết thúc) */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Ngày bắt đầu
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-[34px] pl-3 pr-2 text-xs bg-white border border-slate-300/80 rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#14B8A6] transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Ngày kết thúc
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-[34px] pl-3 pr-2 text-xs bg-white border border-slate-300/80 rounded-[8px] text-[#0F172A] focus:outline-none focus:border-[#14B8A6] transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Trường 4: Ảnh bìa (Upload dropzone) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Ảnh bìa
            </label>
            <label className="relative w-full h-[89px] rounded-[8px] border-2 border-dashed border-slate-400/40 bg-white/60 hover:bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors group overflow-hidden">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Ảnh bìa xem trước"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#64748B] group-hover:text-slate-900 transition-colors">
                  <Camera className="w-5 h-5 mb-1.5 stroke-[1.8]" />
                  <span className="text-xs font-semibold">Thêm ảnh bìa</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Cụm nút hành động góc dưới phải */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-4 rounded-[8px] border border-slate-300/70 text-xs font-bold text-[#0F172A] hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-[36px] px-5 rounded-[8px] bg-[#14B8A6] hover:bg-[#0D9488] active:scale-95 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              Tạo chuyến đi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};