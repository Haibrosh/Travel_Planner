export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface CollaboratorMember {
  id: string | number;
  name: string;
  email: string;
  role: CollaboratorRole;
  avatarBgColor: string;
  isOnline?: boolean;
}

export interface ChatMessageItem {
  id: string | number;
  senderName: string;
  senderRole: CollaboratorRole;
  avatarBgColor: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
}

export interface PollOptionItem {
  id: string;
  label: string;
  votes: number;
  votedByMe?: boolean;
}

export interface PollItem {
  id: string | number;
  question: string;
  createdBy: string;
  createdAt: string;
  isClosed?: boolean;
  options: PollOptionItem[];
}

export interface CollabAttachmentItem {
  id: string | number;
  name: string;
  type: 'image' | 'document';
  url: string;
  sizeLabel: string;
  uploadedBy: string;
  uploadedAt: string;
}

export const MOCK_INVITE_LINK = 'https://travelsync.app/invite/trip-vung-tau-2026';

export const MOCK_COLLABORATORS: CollaboratorMember[] = [
  {
    id: 1,
    name: 'Trưởng nhóm',
    email: 'leader@travelsync.app',
    role: 'OWNER',
    avatarBgColor: 'bg-teal-600',
    isOnline: true,
  },
  {
    id: 2,
    name: 'Minh Anh',
    email: 'minhanh@travelsync.app',
    role: 'EDITOR',
    avatarBgColor: 'bg-emerald-700',
    isOnline: true,
  },
  {
    id: 3,
    name: 'Hoàng Nam',
    email: 'hoangnam@travelsync.app',
    role: 'VIEWER',
    avatarBgColor: 'bg-sky-700',
    isOnline: false,
  },
];

export const MOCK_CHAT_MESSAGES: ChatMessageItem[] = [
  {
    id: 'm-1',
    senderName: 'Trưởng nhóm',
    senderRole: 'OWNER',
    avatarBgColor: 'bg-teal-600',
    content: 'Mọi người chốt giờ xuất phát sáng thứ Bảy lúc 6h30 nhé!',
    timestamp: '09:15',
  },
  {
    id: 'm-2',
    senderName: 'Minh Anh',
    senderRole: 'EDITOR',
    avatarBgColor: 'bg-emerald-700',
    content: 'Ok nè, mình vừa cập nhật thêm quán hải sản chiều Ngày 1 vào lịch trình.',
    timestamp: '09:18',
  },
  {
    id: 'm-3',
    senderName: 'Bạn',
    senderRole: 'EDITOR',
    avatarBgColor: 'bg-slate-800',
    content: 'Tuyệt! Nhớ vote quán ăn sáng mai ở mục Bình chọn luôn nhé.',
    timestamp: '09:20',
    isMe: true,
  },
];

export const MOCK_POLLS: PollItem[] = [
  {
    id: 'p-1',
    question: 'Bữa sáng Ngày 1 ăn ở đâu?',
    createdBy: 'Minh Anh',
    createdAt: 'Hôm nay, 09:05',
    options: [
      { id: 'opt-1', label: 'Bánh khọt Gốc Vú Sữa', votes: 3, votedByMe: true },
      { id: 'opt-2', label: 'Hủ tiếu mực Ông Già Cali', votes: 2, votedByMe: false },
      { id: 'opt-3', label: 'Cà phê view biển + bánh mì', votes: 1, votedByMe: false },
    ],
  },
  {
    id: 'p-2',
    question: 'Buổi tối có thuê loa kéo / BBQ không?',
    createdBy: 'Trưởng nhóm',
    createdAt: 'Hôm qua',
    options: [
      { id: 'opt-21', label: 'Có, làm BBQ nhẹ tại homestay', votes: 4, votedByMe: false },
      { id: 'opt-22', label: 'Không, đi dạo biển & uống nước', votes: 1, votedByMe: false },
    ],
  },
];

export const MOCK_COLLAB_ATTACHMENTS: CollabAttachmentItem[] = [
  {
    id: 'att-1',
    name: 'Xac-nhan-dat-phong-homestay.pdf',
    type: 'document',
    url: '#',
    sizeLabel: '420 KB',
    uploadedBy: 'Trưởng nhóm',
    uploadedAt: '14/11/2026',
  },
  {
    id: 'att-2',
    name: 'View-san-thuong-homestay.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    sizeLabel: '1.2 MB',
    uploadedBy: 'Minh Anh',
    uploadedAt: '14/11/2026',
  },
  {
    id: 'att-3',
    name: 'Lich-xe-limousine.png',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    sizeLabel: '860 KB',
    uploadedBy: 'Hoàng Nam',
    uploadedAt: '15/11/2026',
  },
];