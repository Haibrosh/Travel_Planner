'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="bg-white w-full max-w-[500px] rounded-[20px] shadow-2xl overflow-hidden border border-slate-200/80 p-6 relative"
      >
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/70">
          <h2 className="text-base font-bold text-[#0F172A] tracking-wide uppercase">
            XÁC NHẬN XÓA CHUYẾN ĐI
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Nội dung thông báo chuẩn 3 dòng y hệt thiết kế */}
        <div className="space-y-2 text-sm">
          <p className="font-medium text-[#0F172A]">
            Bạn có chắc muốn xóa chuyến đi này?
          </p>
          <p className="text-[#64748B] text-xs leading-relaxed">
            Toàn bộ lịch trình, chi phí và dữ liệu bạn đồng hành của chuyến đi sẽ bị xóa.
          </p>
          <p className="text-red-600 text-xs font-medium pt-1">
            Hành động này không thể hoàn tác.
          </p>
        </div>

        {/* Footer Actions (Nút Hủy & Xóa chuyến đi) */}
        <div className="flex items-center justify-end space-x-3 mt-8 pt-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
          >
            Xóa chuyến đi
          </button>
        </div>

      </div>
    </div>
  );
}