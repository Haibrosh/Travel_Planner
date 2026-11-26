'use client';

import { create } from 'zustand';

export type CollabSectionTab = 'chat' | 'poll' | 'media';
export type AttachmentFilterType = 'all' | 'image' | 'document';

interface CollabUiState {
  activeSection: CollabSectionTab;
  attachmentFilter: AttachmentFilterType;
  isInviteModalOpen: boolean;
  isCreatingPoll: boolean;
  copiedInviteLink: boolean;
  setActiveSection: (section: CollabSectionTab) => void;
  setAttachmentFilter: (filter: AttachmentFilterType) => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  setIsCreatingPoll: (open: boolean) => void;
  setCopiedInviteLink: (copied: boolean) => void;
  resetCollabUi: () => void;
}

export const useCollabUiStore = create<CollabUiState>((set) => ({
  activeSection: 'chat',
  attachmentFilter: 'all',
  isInviteModalOpen: false,
  isCreatingPoll: false,
  copiedInviteLink: false,
  setActiveSection: (activeSection) => set({ activeSection }),
  setAttachmentFilter: (attachmentFilter) => set({ attachmentFilter }),
  openInviteModal: () => set({ isInviteModalOpen: true }),
  closeInviteModal: () => set({ isInviteModalOpen: false }),
  setIsCreatingPoll: (isCreatingPoll) => set({ isCreatingPoll }),
  setCopiedInviteLink: (copiedInviteLink) => set({ copiedInviteLink }),
  resetCollabUi: () =>
    set({
      activeSection: 'chat',
      attachmentFilter: 'all',
      isInviteModalOpen: false,
      isCreatingPoll: false,
      copiedInviteLink: false,
    }),
}));