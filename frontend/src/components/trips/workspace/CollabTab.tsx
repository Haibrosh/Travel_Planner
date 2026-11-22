'use client';

import { useState } from 'react';
import { Check, Copy, Crown, Link2, Users } from 'lucide-react';
import type { TripResponse } from '@/types/trip';

interface CollabTabProps {
  trip: TripResponse;
}

export default function CollabTab({ trip }: CollabTabProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/trips/invite/${trip.tripId}`
      : `https://travelsync.vn/trips/invite/${trip.tripId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const members = [
    {
      id: trip.ownerId,
      username: trip.ownerUsername,
      role: 'Trưởng nhóm / Chủ chuyến đi',
      isOwner: true,
    },
    { id: 2, username: 'nguyenvanb', role: 'Thành viên', isOwner: false },
    { id: 3, username: 'thuthao', role: 'Thành viên', isOwner: false },
  ];

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="mx-auto max-w-4xl p-6 sm:p-8 space-y-6"
    >
      {/* Invite Link Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">
              Mời bạn bè tham gia lập kế hoạch
            </h3>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Chia sẻ đường liên kết này để bạn bè có thể xem và cùng chỉnh sửa lịch trình, chi phí theo thời gian thực.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-colors shrink-0 cursor-pointer ${
              copied
                ? 'bg-emerald-600'
                : 'bg-[#14B8A6] hover:bg-[#0D9488]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Member List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">
              Thành viên chuyến đi ({members.length})
            </h3>
            <p className="text-xs text-[#64748B]">
              Những người có quyền truy cập vào bảng kế hoạch
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: member.isOwner ? '#0D9488' : '#14B8A6' }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-white"
                >
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {member.username}
                  </p>
                  <p className="text-[11px] text-[#64748B]">{member.role}</p>
                </div>
              </div>

              {member.isOwner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-[#0F766E]">
                  <Crown className="w-3 h-3" />
                  Chủ chuyến đi
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
