'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  BarChart3,
  Bell,
  BellOff,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Trash2,
  Upload,
  Users,
  Vote,
} from 'lucide-react';
import type { TripResponse } from '@/types/trip';
import {
  MOCK_CHAT_MESSAGES,
  MOCK_COLLAB_ATTACHMENTS,
  MOCK_COLLABORATORS,
  MOCK_POLLS,
  type ChatMessageItem,
  type CollabAttachmentItem,
  type CollaboratorMember,
  type CollaboratorRole,
  type PollItem,
} from '@/mocks/collabData';
import {
  useCollabUiStore,
  type AttachmentFilterType,
} from '@/store/useCollabUiStore';
import { InviteCollaboratorModal } from '@/components/modals/InviteCollaboratorModal';

export interface MemberItem {
  id: string | number;
  name: string;
  email: string;
  avatarBgColor: string;
  isLeader: boolean;
  role?: CollaboratorRole;
}

export interface CollabTabProps {
  trip?: TripResponse;
  members?: CollaboratorMember[] | MemberItem[];
  inviteUrl?: string;
  messages?: ChatMessageItem[];
  unreadCount?: number;
  isChatMuted?: boolean;
  polls?: PollItem[];
  attachments?: CollabAttachmentItem[];
  onSendMessage?: (text: string) => void | Promise<void>;
  onMarkMessagesRead?: () => void | Promise<void>;
  onToggleMuteChat?: (nextMuted: boolean) => void | Promise<void>;
  onVoteOption?: (
    pollId: string | number,
    optionId: string
  ) => void | Promise<void>;
  onCreatePoll?: (question: string, options: string[]) => void | Promise<void>;
  onUploadAttachment?: (file: File) => void | Promise<void>;
  onUpdateMember?: (
    id: string | number,
    newName: string,
    newEmail: string
  ) => void | Promise<void>;
  onDeleteMember?: (id: string | number) => void | Promise<void>;
}

type CollabSectionKey = 'chat' | 'polls' | 'media';

function normalizeCollaborators(
  rawMembers?: ReadonlyArray<CollaboratorMember | MemberItem>
): CollaboratorMember[] {
  if (!rawMembers || rawMembers.length === 0) {
    return MOCK_COLLABORATORS;
  }

  return rawMembers.map((m): CollaboratorMember => {
    const resolvedRole: CollaboratorRole =
      'role' in m && m.role
        ? m.role
        : 'isLeader' in m && m.isLeader
          ? 'OWNER'
          : 'EDITOR';

    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: resolvedRole,
      avatarBgColor: m.avatarBgColor || 'bg-teal-600',
      isOnline: 'isOnline' in m ? m.isOnline : undefined,
    };
  });
}

function resolveOptionVoters(
  option: PollItem['options'][number],
  members: CollaboratorMember[]
): string[] {
  const rawRecord = option as unknown as {
    voters?: Array<string | { name?: string }>;
  };

  if (Array.isArray(rawRecord.voters) && rawRecord.voters.length > 0) {
    return rawRecord.voters
      .map((v) => (typeof v === 'string' ? v : v?.name || ''))
      .filter(Boolean);
  }

  const names: string[] = [];
  if (option.votedByMe) {
    names.push('Bạn');
  }

  const othersNeeded = Math.max(0, option.votes - (option.votedByMe ? 1 : 0));
  const otherMembers = members
    .map((m) => m.name)
    .filter((name) => name !== 'Bạn');

  for (let i = 0; i < othersNeeded; i += 1) {
    names.push(otherMembers[i] ?? `Thành viên ${i + 1}`);
  }

  return names;
}

export const CollabTab: React.FC<CollabTabProps> = ({
  members,
  inviteUrl,
  messages,
  unreadCount,
  isChatMuted,
  polls,
  attachments,
  onSendMessage,
  onMarkMessagesRead,
  onToggleMuteChat,
  onVoteOption,
  onCreatePoll,
  onUploadAttachment,
  onUpdateMember,
  onDeleteMember,
}) => {
  const {
    attachmentFilter,
    isInviteModalOpen,
    isCreatingPoll,
    setAttachmentFilter,
    openInviteModal,
    closeInviteModal,
    setIsCreatingPoll,
  } = useCollabUiStore();

  const [activeSection, setActiveSection] = useState<CollabSectionKey>('chat');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const [localMembers, setLocalMembers] = useState<CollaboratorMember[]>(() =>
    normalizeCollaborators(members)
  );

  const [localMessages, setLocalMessages] =
    useState<ChatMessageItem[]>(MOCK_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState<string>('');
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(0);
  const [localMuted, setLocalMuted] = useState<boolean>(Boolean(isChatMuted));

  const [localPolls, setLocalPolls] = useState<PollItem[]>(MOCK_POLLS);
  const [expandedPollIds, setExpandedPollIds] = useState<
    Record<string, boolean>
  >(() => {
    const first = (polls ?? MOCK_POLLS)[0];
    return first ? { [String(first.id)]: true } : {};
  });
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [localAttachments, setLocalAttachments] = useState<
    CollabAttachmentItem[]
  >(MOCK_COLLAB_ATTACHMENTS);

  const displayMembers = useMemo(
    () => (members ? normalizeCollaborators(members) : localMembers),
    [members, localMembers]
  );
  const displayMessages = messages ?? localMessages;
  const displayUnreadCount = unreadCount ?? localUnreadCount;
  const mutedState = isChatMuted ?? localMuted;
  const displayPolls = polls ?? localPolls;
  const displayAttachments = attachments ?? localAttachments;

  const prevMessageCountRef = useRef<number>(displayMessages.length);

  const filteredAttachments = useMemo(() => {
    if (attachmentFilter === 'all') return displayAttachments;
    return displayAttachments.filter((a) => a.type === attachmentFilter);
  }, [displayAttachments, attachmentFilter]);

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const nextCount = displayMessages.length;

    if (nextCount > prevCount && activeSection !== 'chat') {
      const added = displayMessages.slice(prevCount);
      const incomingCount = added.filter((m) => !m.isMe).length;
      if (incomingCount > 0) {
        setLocalUnreadCount((c) => c + incomingCount);
      }
    }
    prevMessageCountRef.current = nextCount;
  }, [displayMessages, activeSection]);

  useEffect(() => {
    if (activeSection === 'chat') {
      setLocalUnreadCount(0);
      onMarkMessagesRead?.();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBottomBtn(false);
    }
  }, [activeSection, displayMessages.length, onMarkMessagesRead]);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 100);
  };

  const scrollToLatestMessage = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottomBtn(false);
    setLocalUnreadCount(0);
    onMarkMessagesRead?.();
  };

  const handleToggleMute = async () => {
    const nextMuted = !mutedState;
    setLocalMuted(nextMuted);
    // Chừa hook/API bật tắt thông báo chat khi ghép nối backend
    await onToggleMuteChat?.(nextMuted);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    if (onSendMessage) {
      // Chừa hook/API gửi tin nhắn khi ghép nối backend
      await onSendMessage(trimmed);
    } else {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          senderName: 'Bạn',
          senderRole: 'EDITOR',
          avatarBgColor: 'bg-slate-800',
          content: trimmed,
          timestamp: 'Vừa xong',
          isMe: true,
        },
      ]);
    }
    setChatInput('');
  };

  const togglePollExpand = (pollId: string | number) => {
    const key = String(pollId);
    setExpandedPollIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleVote = async (
    pollId: string | number,
    optionId: string
  ) => {
    if (onVoteOption) {
      // Chừa hook/API vote bình chọn khi ghép nối backend
      await onVoteOption(pollId, optionId);
      return;
    }

    setLocalPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map((opt) => {
            if (opt.id !== optionId) return opt;
            const nextVoted = !opt.votedByMe;
            return {
              ...opt,
              votedByMe: nextVoted,
              votes: Math.max(0, opt.votes + (nextVoted ? 1 : -1)),
            };
          }),
        };
      })
    );
  };

  const handleOptionChange = (index: number, value: string) => {
    setPollOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? value : opt))
    );
  };

  const handleAddOptionField = () => {
    setPollOptions((prev) => [...prev, '']);
  };

  const handleRemoveOptionField = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = pollQuestion.trim();
    const optList = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!q || optList.length < 2) return;

    if (onCreatePoll) {
      // Chừa hook/API tạo bình chọn khi ghép nối backend
      await onCreatePoll(q, optList);
    } else {
      const newId = Date.now();
      const created: PollItem = {
        id: newId,
        question: q,
        createdBy: 'Bạn',
        createdAt: 'Vừa tạo',
        options: optList.map((label, idx) => ({
          id: `opt-${newId}-${idx}`,
          label,
          votes: 0,
          votedByMe: false,
        })),
      };
      setLocalPolls((prev) => [created, ...prev]);
      setExpandedPollIds((prev) => ({ ...prev, [String(newId)]: true }));
    }

    setPollQuestion('');
    setPollOptions(['', '']);
    setIsCreatingPoll(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onUploadAttachment) {
      // Chừa hook/API upload tệp đính kèm khi ghép nối backend
      await onUploadAttachment(file);
    } else {
      const isImg = file.type.startsWith('image/');
      const newItem: CollabAttachmentItem = {
        id: Date.now(),
        name: file.name,
        type: isImg ? 'image' : 'document',
        url: isImg ? URL.createObjectURL(file) : '#',
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        uploadedBy: 'Bạn',
        uploadedAt: 'Hôm nay',
      };
      setLocalAttachments((prev) => [newItem, ...prev]);
    }
    e.target.value = '';
  };

  const handleChangeMemberRole = async (
    memberId: string | number,
    nextRole: CollaboratorRole
  ) => {
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m))
    );
    const target = displayMembers.find((m) => m.id === memberId);
    if (target && onUpdateMember) {
      await onUpdateMember(memberId, target.name, target.email);
    }
  };

  const handleRemoveMember = async (memberId: string | number) => {
    setLocalMembers((prev) => prev.filter((m) => m.id !== memberId));
    await onDeleteMember?.(memberId);
  };

  const navItems: {
    key: CollabSectionKey;
    label: string;
    badge?: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'chat',
      label: 'Chat',
      badge: displayUnreadCount > 0 ? displayUnreadCount : undefined,
      icon: <MessageSquare className="h-4 w-4 shrink-0" />,
    },
    {
      key: 'polls',
      label: 'Bình chọn',
      badge: displayPolls.length,
      icon: <Vote className="h-4 w-4 shrink-0" />,
    },
    {
      key: 'media',
      label: 'Ảnh & Tài liệu',
      badge: displayAttachments.length,
      icon: <ImageIcon className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs animate-in fade-in duration-200">
      {/* SIDEBAR TRÁI */}
      <aside className="flex w-40 shrink-0 flex-col justify-between border-r border-slate-100 bg-slate-50/70 p-2.5 sm:w-44">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.key;
            const isUnreadChatBadge =
              item.key === 'chat' && typeof item.badge === 'number';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#14B8A6] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badge === 'number' && (
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                      isUnreadChatBadge
                        ? 'bg-rose-500 text-white'
                        : isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={openInviteModal}
            className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5 text-left text-xs font-bold text-[#0F766E] transition-colors hover:bg-teal-100/80"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Chia sẻ</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/80 px-2.5 py-2 text-[11px] font-semibold text-slate-500">
          <Users className="h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
          <span className="truncate tabular-nums">
            {displayMembers.length} thành viên
          </span>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH FULL CHIỀU CAO */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        {activeSection === 'chat' && (
          <>
            <div className="relative min-h-0 flex-1">
              {/* Nút bật/tắt thông báo chat gọn ở góc trên phải */}
              <button
                type="button"
                onClick={handleToggleMute}
                title={
                  mutedState
                    ? 'Đang tắt thông báo chat (bấm để bật)'
                    : 'Tắt thông báo chat'
                }
                aria-label={
                  mutedState ? 'Bật thông báo chat' : 'Tắt thông báo chat'
                }
                className={`absolute top-2.5 right-3 z-10 inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-2xs backdrop-blur-xs transition-colors ${
                  mutedState
                    ? 'border-amber-200 bg-amber-50/95 text-amber-700 hover:bg-amber-100'
                    : 'border-slate-200/80 bg-white/90 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {mutedState ? (
                  <>
                    <BellOff className="h-3.5 w-3.5" />
                    <span>Đã tắt thông báo</span>
                  </>
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
              </button>

              <div
                ref={chatScrollRef}
                onScroll={handleChatScroll}
                className="custom-scrollbar h-full space-y-3.5 overflow-y-auto bg-slate-50/40 p-4 pt-10"
              >
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.isMe ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${msg.avatarBgColor}`}
                    >
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                        msg.isMe
                          ? 'rounded-tr-sm bg-[#14B8A6] text-white'
                          : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div
                        className={`mb-0.5 flex items-center gap-2 text-[10px] font-bold ${
                          msg.isMe ? 'justify-end text-teal-50' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Nút cuộn xuống tin nhắn mới nhất */}
              {showScrollBottomBtn && (
                <button
                  type="button"
                  onClick={scrollToLatestMessage}
                  title="Cuộn xuống tin nhắn mới nhất"
                  aria-label="Cuộn xuống tin nhắn mới nhất"
                  className="absolute bottom-3 right-3.5 z-10 inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-[#0F766E] shadow-md transition-all hover:bg-teal-50"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  <span>Mới nhất</span>
                </button>
              )}
            </div>

            <form
              onSubmit={handleChatSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin cho nhóm..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#14B8A6] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#14B8A6] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0D9488]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </>
        )}

        {activeSection === 'polls' && (
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-slate-50/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <BarChart3 className="h-4 w-4 text-[#0F766E]" />
                <span>Bình chọn nhóm ({displayPolls.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingPoll(!isCreatingPoll)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[#14B8A6] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0D9488]"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{isCreatingPoll ? 'Ẩn form' : 'Tạo poll'}</span>
              </button>
            </div>

            {isCreatingPoll && (
              <form
                onSubmit={handleCreatePollSubmit}
                className="space-y-2.5 rounded-2xl border border-teal-200 bg-white p-3.5 text-xs shadow-2xs"
              >
                <input
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Câu hỏi bình chọn..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#14B8A6] focus:outline-none"
                />

                <div className="space-y-2">
                  {pollOptions.map((optValue, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required={idx < 2}
                        value={optValue}
                        onChange={(e) =>
                          handleOptionChange(idx, e.target.value)
                        }
                        placeholder={`Lựa chọn ${idx + 1}`}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#14B8A6] focus:outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          aria-label={`Xóa lựa chọn ${idx + 1}`}
                          className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-teal-200 bg-teal-50/70 px-3 py-1.5 text-[11px] font-bold text-[#0F766E] transition-colors hover:bg-teal-100/80"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm lựa chọn</span>
                  </button>

                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-[#14B8A6] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0D9488]"
                  >
                    Đăng bình chọn
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {displayPolls.map((poll) => {
                const totalVotes = poll.options.reduce(
                  (sum, o) => sum + o.votes,
                  0
                );
                const isExpanded = Boolean(expandedPollIds[String(poll.id)]);
                const myChoice = poll.options.find((o) => o.votedByMe);

                return (
                  <div
                    key={poll.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                  >
                    {/* Header poll bấm để thu gọn / xổ ra */}
                    <button
                      type="button"
                      onClick={() => togglePollExpand(poll.id)}
                      aria-expanded={isExpanded}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900">
                          {poll.question}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span>
                            {poll.createdBy} • {totalVotes} lượt vote
                          </span>
                          {myChoice && (
                            <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0F766E]">
                              Đã chọn: {myChoice.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[#0F766E]' : ''
                        }`}
                      />
                    </button>

                    {/* Danh sách lựa chọn & người vote khi xổ ra */}
                    {isExpanded && (
                      <div className="space-y-2 border-t border-slate-100 bg-slate-50/40 p-3.5">
                        {poll.options.map((opt) => {
                          const pct =
                            totalVotes > 0
                              ? Math.round((opt.votes / totalVotes) * 100)
                              : 0;
                          const voters = resolveOptionVoters(
                            opt,
                            displayMembers
                          );

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleToggleVote(poll.id, opt.id)}
                              className={`w-full cursor-pointer rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
                                opt.votedByMe
                                  ? 'border-[#14B8A6] bg-teal-50/70'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                                <span>{opt.label}</span>
                                <span className="tabular-nums text-[#0F766E]">
                                  {opt.votes} ({pct}%)
                                </span>
                              </div>

                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className="h-full rounded-full bg-[#14B8A6] transition-all duration-300"
                                />
                              </div>

                              {/* Hiển thị người đã vote cho lựa chọn này */}
                              <div className="mt-2 flex flex-wrap items-center gap-1">
                                {voters.length === 0 ? (
                                  <span className="text-[10px] text-slate-400">
                                    Chưa có ai bình chọn
                                  </span>
                                ) : (
                                  voters.map((voterName, idx) => (
                                    <span
                                      key={`${opt.id}-voter-${idx}`}
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        voterName === 'Bạn'
                                          ? 'bg-[#14B8A6] text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/10 text-[9px] font-extrabold">
                                        {voterName.charAt(0).toUpperCase()}
                                      </span>
                                      <span>{voterName}</span>
                                    </span>
                                  ))
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === 'media' && (
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-slate-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { key: 'all', label: 'Tất cả' },
                    { key: 'image', label: 'Ảnh' },
                    { key: 'document', label: 'Tài liệu' },
                  ] as { key: AttachmentFilterType; label: string }[]
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setAttachmentFilter(f.key)}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      attachmentFilter === f.key
                        ? 'bg-[#14B8A6] text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#14B8A6] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0D9488]">
                <Upload className="h-3.5 w-3.5" />
                <span>Tải lên</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredAttachments.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs"
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E]">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {item.sizeLabel} • {item.uploadedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Chia sẻ chuyến đi */}
      <InviteCollaboratorModal
        isOpen={isInviteModalOpen}
        onClose={closeInviteModal}
        members={displayMembers}
        inviteLink={inviteUrl}
        onChangeRole={handleChangeMemberRole}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
};

export default CollabTab;