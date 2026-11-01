'use client';

import { useState } from 'react';
import type { TripResponse } from '@/types/trip';

interface CollabTabProps {
  trip: TripResponse;
}

export default function CollabTab({ trip }: CollabTabProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/trips/invite/${trip.tripId}`
    : `https://travelplanner.vn/trips/invite/${trip.tripId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const members = [
    { id: trip.ownerId, username: trip.ownerUsername, role: 'Trưởng nhóm / Chủ chuyến đi', isOwner: true },
    { id: 2, username: 'nguyenvanb', role: 'Thành viên', isOwner: false },
    { id: 3, username: 'thuthao', role: 'Thành viên', isOwner: false },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-8">
      {/* Invite Link Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Mời bạn bè tham gia lập kế hoạch
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Chia sẻ đường liên kết này để bạn bè có thể xem và cùng chỉnh sửa lịch trình, chi phí theo thời gian thực.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-mono text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          />
          <button
            onClick={handleCopy}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shrink-0"
          >
            {copied ? 'Đã sao chép!' : 'Sao chép link'}
          </button>
        </div>
      </div>

      {/* Member List */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Thành viên chuyến đi ({members.length})
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Những người có quyền truy cập vào bảng kế hoạch</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {member.username}
                  </p>
                  <p className="text-[11px] text-zinc-500">{member.role}</p>
                </div>
              </div>

              {member.isOwner && (
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Owner
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
