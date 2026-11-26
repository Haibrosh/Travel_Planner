'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  MOCK_COLLABORATORS,
  MOCK_INVITE_LINK,
  type CollaboratorMember,
  type CollaboratorRole,
} from '@/mocks/collabData';

export interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members?: CollaboratorMember[];
  inviteLink?: string;
  onRegenerateLink?: () => string | void | Promise<string | void>;
  onInviteByEmail?: (
    email: string,
    role: CollaboratorRole
  ) => void | Promise<void>;
  onChangeRole?: (
    memberId: string | number,
    nextRole: CollaboratorRole
  ) => void | Promise<void>;
  onRemoveMember?: (memberId: string | number) => void | Promise<void>;
}

const ROLE_DESCRIPTIONS: Record<CollaboratorRole, string> = {
  OWNER: 'Chủ chuyến đi (OWNER)',
  EDITOR: 'Quyền chỉnh sửa (EDITOR)',
  VIEWER: 'Quyền chỉ xem (VIEWER)',
};

export const InviteCollaboratorModal: React.FC<
  InviteCollaboratorModalProps
> = ({
  isOpen,
  onClose,
  members,
  inviteLink = MOCK_INVITE_LINK,
  onRegenerateLink,
  onInviteByEmail,
  onChangeRole,
  onRemoveMember,
}) => {
  const [localMembers, setLocalMembers] =
    useState<CollaboratorMember[]>(MOCK_COLLABORATORS);
  const [currentLink, setCurrentLink] = useState<string>(inviteLink);
  const [copied, setCopied] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('EDITOR');
  const [memberToRemove, setMemberToRemove] =
    useState<CollaboratorMember | null>(null);

  useEffect(() => {
    setCurrentLink(inviteLink);
  }, [inviteLink]);

  useEffect(() => {
    if (!isOpen) {
      setMemberToRemove(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayMembers = members ?? localMembers;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentLink);
    } catch {
      // Fallback khi trình duyệt chặn clipboard
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNewLink = async () => {
    const nextUrl = await onRegenerateLink?.();
    if (typeof nextUrl === 'string' && nextUrl.trim()) {
      setCurrentLink(nextUrl.trim());
      return;
    }
    const token = Math.random().toString(36).slice(2, 8);
    setCurrentLink(`${MOCK_INVITE_LINK}?token=${token}`);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;

    if (onInviteByEmail) {
      await onInviteByEmail(trimmed, inviteRole);
    } else {
      const displayName = trimmed.split('@')[0] || 'Thành viên mới';
      setLocalMembers((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: displayName,
          email: trimmed,
          role: inviteRole,
          avatarBgColor: 'bg-teal-700',
          isOnline: false,
        },
      ]);
    }
    setInviteEmail('');
  };

  const handleRoleChange = async (
    memberId: string | number,
    nextRole: CollaboratorRole
  ) => {
    if (onChangeRole) {
      await onChangeRole(memberId, nextRole);
    } else {
      setLocalMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m))
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToRemove) return;
    const targetId = memberToRemove.id;
    setMemberToRemove(null);

    if (onRemoveMember) {
      // Chừa hook/API xóa thành viên khỏi chuyến đi khi ghép nối backend
      await onRemoveMember(targetId);
    } else {
      setLocalMembers((prev) => prev.filter((m) => m.id !== targetId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px] animate-in fade-in duration-150">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Chia sẻ chuyến đi
              </h2>
              <p className="text-xs text-slate-500">
                Mời bạn bè và phân quyền thành viên tham gia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal chia sẻ"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
          {/* 1. Tạo & copy link mời */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-700">
                Link mời tham gia chuyến đi
              </span>
              <button
                type="button"
                onClick={handleCreateNewLink}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Tạo link mời</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentLink}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#14B8A6] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0D9488]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Đã copy</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Mời qua email + chọn quyền */}
          <form onSubmit={handleInviteSubmit} className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700">
              Mời thành viên qua email
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="banbe@example.com"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#14B8A6] focus:outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as CollaboratorRole)
                }
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-[#14B8A6] focus:outline-none"
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Mời</span>
              </button>
            </div>
          </form>

          {/* 3. Danh sách thành viên kèm quyền OWNER / EDITOR / VIEWER */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Thành viên tham gia ({displayMembers.length})
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Shield className="h-3 w-3 text-[#0F766E]" />
                Quyền truy cập
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {displayMembers.map((member) => {
                const isOwner = member.role === 'OWNER';
                const initial =
                  member.name.trim().charAt(0).toUpperCase() || 'U';
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${member.avatarBgColor}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-slate-900">
                          {member.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isOwner ? (
                        <span
                          title={ROLE_DESCRIPTIONS.OWNER}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-extrabold text-[#0F766E]"
                        >
                          OWNER
                        </span>
                      ) : (
                        <>
                          <select
                            aria-label={`Quyền của ${member.name}`}
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.id,
                                e.target.value as CollaboratorRole
                              )
                            }
                            title={ROLE_DESCRIPTIONS[member.role]}
                            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 focus:border-[#14B8A6] focus:outline-none"
                          >
                            <option value="EDITOR">EDITOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setMemberToRemove(member)}
                            aria-label={`Xóa ${member.name}`}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa thành viên */}
      {memberToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Xóa thành viên khỏi chuyến đi?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Bạn có chắc muốn xóa{' '}
                  <span className="font-bold text-slate-800">
                    {memberToRemove.name}
                  </span>{' '}
                  ({memberToRemove.email})? Người này sẽ không còn quyền xem
                  hoặc chỉnh sửa chuyến đi.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-rose-700"
              >
                Xóa thành viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteCollaboratorModal;