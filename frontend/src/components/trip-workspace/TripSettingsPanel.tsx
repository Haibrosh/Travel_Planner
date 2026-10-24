'use client';

import React, { useState } from 'react';
import { Archive, Trash2, Save, Calendar, MapPin, DollarSign, CheckCircle2 } from 'lucide-react';

export interface TripSettingsData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: string;
  isArchived: boolean;
  isCompleted: boolean; // Thêm trạng thái hoàn thành chuyến đi
}

export interface TripSettingsPanelProps {
  initialTrip: TripSettingsData;
  onSaveSettings: (updatedData: TripSettingsData) => void;
  onToggleArchive: () => void;
  onToggleComplete: () => void; // Hàm xử lý đánh dấu hoàn thành
  onDeleteTrip: () => void;
}

export const TripSettingsPanel: React.FC<TripSettingsPanelProps> = ({
  initialTrip,
  onSaveSettings,
  onToggleArchive,
  onToggleComplete,
  onDeleteTrip,
}) => {
  const [title, setTitle] = useState(initialTrip.title);
  const [location, setLocation] = useState(initialTrip.location);
  const [startDate, setStartDate] = useState(initialTrip.startDate);
  const [endDate, setEndDate] = useState(initialTrip.endDate);
  const [budget, setBudget] = useState(initialTrip.budget);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      title,
      location,
      startDate,
      endDate,
      budget,
      isArchived: initialTrip.isArchived,
      isCompleted: initialTrip.isCompleted,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-8">
      
      {/* Tiêu đề tab (Đã bỏ icon cho đồng bộ hoàn toàn với các tab khác) */}
      <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
        CÀI ĐẶT CHUYẾN ĐI
      </h2>

      {/* Form Cập nhật thông tin cơ bản */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <h3 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">
          Thông tin chung
        </h3>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Tên chuyến đi</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Địa điểm</label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Ngày bắt đầu</label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Ngày kết thúc</label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all cursor-pointer"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Ngân sách dự kiến</label>
          <div className="relative flex items-center">
            <DollarSign className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              isSaved ? 'bg-emerald-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Đã lưu thay đổi!' : 'Lưu cài đặt'}</span>
          </button>
        </div>
      </form>

      {/* Khu vực quản lý nâng cao (Hoàn thành, Lưu trữ & Xóa chuyến đi) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <h3 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">
          Quản lý hành trình
        </h3>

        {/* Mục 1: Đánh dấu Hoàn thành chuyến đi */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-slate-800">
              {initialTrip.isCompleted ? 'Đã hoàn thành chuyến đi' : 'Đánh dấu đã hoàn thành'}
            </span>
            <span className="text-[11px] text-slate-400">
              {initialTrip.isCompleted ? 'Chuyến đi đã kết thúc và được phân loại hoàn thành.' : 'Chuyển trạng thái chuyến đi sang mục Đã hoàn thành.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleComplete}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              initialTrip.isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{initialTrip.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
          </button>
        </div>

        {/* Mục 2: Lưu trữ chuyến đi */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-slate-800">
              {initialTrip.isArchived ? 'Khôi phục chuyến đi' : 'Lưu trữ chuyến đi'}
            </span>
            <span className="text-[11px] text-slate-400">
              {initialTrip.isArchived ? 'Đưa chuyến đi trở lại danh sách hoạt động.' : 'Lưu trữ chuyến đi này khi không muốn hiển thị ngoài danh sách chính.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleArchive}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{initialTrip.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}</span>
          </button>
        </div>

        {/* Mục 3: Xóa vĩnh viễn */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-rose-600">
              Xóa vĩnh viễn chuyến đi
            </span>
            <span className="text-[11px] text-slate-400">
              Hành động này không thể hoàn tác. Toàn bộ lịch trình và chi phí sẽ bị xóa.
            </span>
          </div>
          <button
            type="button"
            onClick={onDeleteTrip}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa chuyến đi</span>
          </button>
        </div>
      </div>

    </div>
  );
};