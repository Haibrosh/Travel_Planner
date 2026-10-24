'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';

interface Trip {
  id: string | number;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: string;
  coverImage?: string;
}

interface UpdateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onSave: (updatedTrip: Trip) => void;
}

export default function UpdateTripModal({ isOpen, onClose, trip, onSave }: UpdateTripModalProps) {
  const [formData, setFormData] = useState<Trip>({
    id: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    coverImage: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (trip) {
      setFormData({
        id: trip.id,
        title: trip.title || '',
        location: trip.location || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        budget: trip.budget || '',
        coverImage: trip.coverImage || '' // Không gán cứng link ảnh ngoài ý muốn
      });
    }
  }, [trip]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, coverImage: imageUrl }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-50 w-full max-w-[500px] rounded-[20px] shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa chuyến đi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin chi tiết cho hành trình của bạn</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            
            {/* Tên chuyến đi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên chuyến đi</label>
              <input 
                type="text" 
                name="title"
                value={formData.title} 
                onChange={handleChange}
                placeholder="VD: Khám phá Đà Lạt Mộng Mơ"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" 
              />
            </div>

            {/* Địa điểm */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm</label>
              <input 
                type="text" 
                name="location"
                value={formData.location} 
                onChange={handleChange}
                placeholder="VD: Đà Lạt, Lâm Đồng"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" 
              />
            </div>

            {/* Thời gian */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={formData.startDate} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc</label>
                <input 
                  type="date" 
                  name="endDate"
                  value={formData.endDate} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer" 
                />
              </div>
            </div>

            {/* Ngân sách */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngân sách dự kiến (VNĐ)</label>
              <input 
                type="text" 
                name="budget"
                value={formData.budget} 
                onChange={handleChange}
                placeholder="VD: 3,500,000"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" 
              />
            </div>

            {/* Ảnh bìa */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh bìa chuyến đi</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-3 flex items-center space-x-4 bg-white hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500 font-medium overflow-hidden border border-slate-100 flex-shrink-0 relative">
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-teal-500" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">Nhấn để thay đổi ảnh bìa</p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG hoặc GIF (Tối đa 5MB)</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white border-t border-slate-200/60">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 shadow-sm shadow-teal-500/20 transition-all cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}