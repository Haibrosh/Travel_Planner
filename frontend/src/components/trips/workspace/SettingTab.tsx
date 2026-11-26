'use client';

import React, { useEffect, useState } from 'react';
import { Archive, Trash2, Save, Calendar, MapPin, DollarSign, CheckCircle2 } from 'lucide-react';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';

export interface SettingTabData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: string;
  isArchived: boolean;
  isCompleted: boolean;
}

export interface SettingTabProps {
  initialTrip?: SettingTabData;
  onSaveSettings?: (updatedData: SettingTabData) => void;
  onToggleArchive?: (nextArchived: boolean) => void;
  onToggleComplete?: (nextCompleted: boolean) => void;
  onDeleteTrip?: () => void;
}

const DEFAULT_TRIP_DATA: SettingTabData = {
  title: 'Chuyến đi mới',
  location: 'Chưa cập nhật địa điểm',
  startDate: '',
  endDate: '',
  budget: '0 đ',
  isArchived: false,
  isCompleted: false,
};

export const SettingTab: React.FC<SettingTabProps> = ({
  initialTrip,
  onSaveSettings,
  onToggleArchive,
  onToggleComplete,
  onDeleteTrip,
}) => {
  const safeTrip = initialTrip ?? DEFAULT_TRIP_DATA;

  const [title, setTitle] = useState(safeTrip.title);
  const [location, setLocation] = useState(safeTrip.location);
  const [startDate, setStartDate] = useState(safeTrip.startDate);
  const [endDate, setEndDate] = useState(safeTrip.endDate);
  const [budget, setBudget] = useState(safeTrip.budget);
  const [isCompleted, setIsCompleted] = useState(safeTrip.isCompleted);
  const [isArchived, setIsArchived] = useState(safeTrip.isArchived);
  const [isSaved, setIsSaved] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setIsCompleted(safeTrip.isCompleted);
    setIsArchived(safeTrip.isArchived);
  }, [safeTrip.isCompleted, safeTrip.isArchived]);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => {
      setStatusFeedback((prev) => (prev === msg ? null : prev));
    }, 1800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Chừa hook/API cập nhật thông tin chuyến đi ở tầng cha khi ghép nối backend
    onSaveSettings?.({
      title,
      location,
      startDate,
      endDate,
      budget,
      isArchived,
      isCompleted,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleToggleCompleteClick = () => {
    const nextCompleted = !isCompleted;
    setIsCompleted(nextCompleted);
    showFeedback(nextCompleted ? 'Đã đánh dấu hoàn thành' : 'Đã bỏ đánh dấu hoàn thành');
    // Chừa chỗ cho API PATCH/PUT trạng thái hoàn thành chuyến đi
    onToggleComplete?.(nextCompleted);
  };

  const handleToggleArchiveClick = () => {
    const nextArchived = !isArchived;
    setIsArchived(nextArchived);
    showFeedback(nextArchived ? 'Đã chuyển vào lưu trữ' : 'Đã khôi phục chuyến đi');
    // Chừa chỗ cho API PATCH/PUT trạng thái lưu trữ chuyến đi
    onToggleArchive?.(nextArchived);
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    // Chừa chỗ cho API DELETE chuyến đi ở tầng cha khi ghép nối backend
    onDeleteTrip?.();
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
          CÀI ĐẶT CHUYẾN ĐI
        </h2>
        {statusFeedback && (
          <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-[11px] font-bold text-teal-700 animate-in fade-in duration-150">
            {statusFeedback}
          </span>
        )}
      </div>

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
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
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
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2.5 px-3 -mx-3 rounded-xl border-b border-slate-100 transition-colors duration-200 ${
            isCompleted ? 'bg-emerald-50/50' : ''
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-slate-800">
              {isCompleted ? 'Đã hoàn thành chuyến đi' : 'Đánh dấu đã hoàn thành'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isCompleted ? 'Chuyến đi đã kết thúc và được phân loại hoàn thành.' : 'Chuyển trạng thái chuyến đi sang mục Đã hoàn thành.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleCompleteClick}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer flex-shrink-0 ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 transition-transform duration-200 ${isCompleted ? 'scale-110' : ''}`} />
            <span>{isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
          </button>
        </div>

        {/* Mục 2: Lưu trữ chuyến đi */}
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2.5 px-3 -mx-3 rounded-xl border-b border-slate-100 transition-colors duration-200 ${
            isArchived ? 'bg-amber-50/50' : ''
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-slate-800">
              {isArchived ? 'Khôi phục chuyến đi' : 'Lưu trữ chuyến đi'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isArchived ? 'Đưa chuyến đi trở lại danh sách hoạt động.' : 'Lưu trữ chuyến đi này khi không muốn hiển thị ngoài danh sách chính.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleArchiveClick}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer flex-shrink-0 ${
              isArchived
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}</span>
          </button>
        </div>

        {/* Mục 3: Xóa vĩnh viễn */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 px-3 -mx-3 rounded-xl">
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
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa chuyến đi</span>
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};