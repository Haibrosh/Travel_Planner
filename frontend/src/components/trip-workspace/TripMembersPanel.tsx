'use client';

import React from 'react';
import { InviteLinkCard } from './InviteLinkCard'; // Đảm bảo đã import InviteLinkCard
import { MemberCard } from '@/components/cards/MemberCard';

export interface MemberItem { // Đảm bảo có từ khóa export ở đây để page.tsx dùng được
  id: string | number;
  name: string;
  email: string;
  avatarBgColor: string;
  isLeader: boolean;
}

export interface TripMembersPanelProps {
  members: MemberItem[];
  inviteUrl: string; // Nhận link mời từ page.tsx xuống
  onUpdateMember: (id: string | number, newName: string, newEmail: string) => void;
  onDeleteMember: (id: string | number) => void;
}

export const TripMembersPanel: React.FC<TripMembersPanelProps> = ({
  members,
  inviteUrl,
  onUpdateMember,
  onDeleteMember,
}) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-8">
      
      {/* Tiêu đề tab */}
      <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
        BẠN BÈ
      </h2>

      {/* 1. Thẻ link mời tham gia (Nhận URL tùy biến từ props) */}
      <InviteLinkCard inviteUrl={inviteUrl} />

      {/* 2. Danh sách thành viên */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-extrabold text-slate-400 tracking-wider">
          DANH SÁCH THÀNH VIÊN
        </h3>

        <div className="flex flex-col gap-3">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              id={member.id}
              name={member.name}
              email={member.email}
              avatarBgColor={member.avatarBgColor}
              isLeader={member.isLeader}
              onUpdate={onUpdateMember}
              onDelete={() => onDeleteMember(member.id)}
            />
          ))}
        </div>
      </div>

    </div>
  );
};