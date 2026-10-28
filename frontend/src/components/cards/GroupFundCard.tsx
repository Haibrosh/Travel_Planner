'use client';

import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export interface GroupFundCardProps {
  initialBalance?: number;
  onSaveBalance?: (newBalance: number) => void;
}

export const GroupFundCard: React.FC<GroupFundCardProps> = ({
  initialBalance = 10000000,
  onSaveBalance,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [balance, setBalance] = useState(initialBalance);
  const [tempBalance, setTempBalance] = useState(balance.toString());

  const handleSave = () => {
    const num = Number(tempBalance.replace(/\D/g, ''));
    if (!isNaN(num)) {
      setBalance(num);
      onSaveBalance?.(num);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempBalance(balance.toString());
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between relative transition-all">
      
      {/* Tiêu đề và nút Chỉnh sửa */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 tracking-wider">
          SỐ DƯ QUỸ NHÓM
        </span>
        
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>Chỉnh sửa</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Hiển thị số tiền hoặc ô Input khi đang ở chế độ chỉnh sửa */}
      <div className="mt-3">
        {!isEditing ? (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {balance.toLocaleString('vi-VN')} đ
          </h2>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={Number(tempBalance).toLocaleString('vi-VN')}
              onChange={(e) => setTempBalance(e.target.value.replace(/\D/g, ''))}
              className="w-full text-2xl sm:text-3xl font-extrabold text-[#0F172A] bg-white border border-teal-500 rounded-xl px-3 py-1 outline-none shadow-inner"
            />
            <span className="text-xl font-bold text-slate-500">đ</span>
          </div>
        )}
      </div>

    </div>
  );
};