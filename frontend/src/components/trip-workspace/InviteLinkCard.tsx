'use client';

import React, { useState } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';

export interface InviteLinkCardProps {
  inviteUrl: string; // Bắt buộc nhận từ props truyền xuống để tùy biến
}

export const InviteLinkCard: React.FC<InviteLinkCardProps> = ({
  inviteUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-extrabold text-slate-800">
          Mời bạn bè cùng lên kế hoạch
        </span>
        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium truncate">
          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-teal-600" />
          <span className="truncate">{inviteUrl}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
          copied
            ? 'bg-emerald-600 text-white'
            : 'bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-sm'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Đã sao chép</span>
          </>
        ) : (
          <span>Sao chép link</span>
        )}
      </button>
    </div>
  );
};