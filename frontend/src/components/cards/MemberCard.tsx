'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export interface MemberCardProps {
  id: string | number;
  name: string;
  email: string;
  avatarBgColor?: string;
  isLeader?: boolean;
  onUpdate?: (id: string | number, newName: string, newEmail: string) => void;
  onDelete?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  id,
  name,
  email,
  avatarBgColor = 'bg-teal-600',
  isLeader = false,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempEmail, setTempEmail] = useState(email);

  const handleSave = () => {
    if (!tempName.trim()) return;
    onUpdate?.(id, tempName.trim(), tempEmail.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(name);
    setTempEmail(email);
    setIsEditing(false);
  };

  const initial = tempName ? tempName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
      
      {/* Thông tin bên trái: Avatar + Tên & Email (Hoặc Input khi đang sửa) */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        <div className={`w-10 h-10 rounded-full ${avatarBgColor} text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs`}>
          {initial}
        </div>

        {!isEditing ? (
          <div className="flex flex-col min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 truncate">
              {name}
            </h4>
            <p className="text-xs font-medium text-slate-400 truncate">
              {email}
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Tên thành viên..."
              className="bg-slate-50 border border-teal-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none w-full"
              autoFocus
            />
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="Email..."
              className="bg-slate-50 border border-teal-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none w-full"
            />
          </div>
        )}
      </div>

      {/* Hành động bên phải: Trưởng nhóm hoặc các nút Sửa/Xóa / Lưu/Hủy */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLeader ? (
          <span className="px-3.5 py-1.5 rounded-full bg-[#14B8A6] text-white text-[11px] font-extrabold shadow-xs">
            Trưởng nhóm
          </span>
        ) : !isEditing ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="Sửa trực tiếp"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Xóa thành viên"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSave}
              className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              title="Lưu"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
              title="Hủy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};