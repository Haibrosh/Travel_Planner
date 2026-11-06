'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { TripHeaderCard } from '@/components/trip-workspace/TripHeaderCard';
import { TripTabsNav, TripTabType } from '@/components/trip-workspace/TripTabsNav';
import { ItineraryTab } from '@/components/trip-workspace/ItineraryTab';
import { TripBudgetPanel } from '@/components/trip-workspace/TripBudgetPanel';
import { TripMembersPanel, MemberItem } from '@/components/trip-workspace/TripMembersPanel';
import { TripSettingsPanel, TripSettingsData } from '@/components/trip-workspace/TripSettingsPanel';
import { MapWorkspacePanel, MapPinItem } from '@/components/trip-workspace/MapWorkspacePanel';
import { LocationSuggestion } from '@/components/trip-workspace/AddLocationBar';
import { CreateTripModal, NewTripFormData } from '@/components/modals/CreateTripModal';
import { useMapStore } from '@/store/useMapStore';
import { ExpenseItem } from '@/components/cards/TotalExpenseCard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TripTabType>('timeline');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Lấy state và actions từ useMapStore
  const { selectedPlace, isModalOpen, openModal } = useMapStore();

  // State chung chuyến đi
  const [tripInfo, setTripInfo] = useState<TripSettingsData>({
    title: 'ĐÀ LẠT MỘNG MƠ',
    location: 'Đà Lạt, Lâm Đồng',
    startDate: '2026-11-07',
    endDate: '2026-11-10',
    budget: '10,000,000 đ',
    isArchived: false,
    isCompleted: false,
  });

  // 1. State Tab Lịch trình
  const [activities, setActivities] = useState([
    {
      id: 1,
      title: 'Hồ Xuân Hương',
      timeRange: '8:00 AM - 9:30 AM',
      category: ['Tham quan'],
      note: 'Thuê xe đạp đôi dạo quanh hồ',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      address: 'Phường 1, Thành phố Đà Lạt, Lâm Đồng',
      rating: 4.6,
      isVisited: true,
      top: '40%',
      left: '45%',
    },
    {
      id: 2,
      title: 'Vườn hoa Thành phố Đà Lạt',
      timeRange: '9:45 AM - 11:00 AM',
      category: ['Tham quan', 'Chụp ảnh'],
      note: 'Chụp ảnh kỷ niệm',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      address: 'Bà Huyện Thanh Quan, Phường 8, Đà Lạt',
      rating: 4.4,
      isVisited: false,
      top: '25%',
      left: '60%',
    },
  ]);

  // 2. State Tab Chi tiêu
  const [fundBalance, setFundBalance] = useState(10000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 1, title: 'Thuê xe đạp đôi', amount: 150000, category: 'Di chuyển', paidBy: 'Trí Viễn' },
    { id: 2, title: 'Ăn trưa Phố cổ', amount: 850000, category: 'Ăn uống', paidBy: 'Quốc Đạt' },
    { id: 3, title: 'Vé vào cổng Vườn hoa', amount: 2500000, category: 'Tham quan', paidBy: 'Đức Anh' },
  ]);

  // 3. State Tab Thành viên
  const [members, setMembers] = useState<MemberItem[]>([
    { id: 1, name: 'Đỗ Trí Viễn', email: 'viento.it@gmail.com', avatarBgColor: 'bg-teal-600', isLeader: true },
    { id: 2, name: 'Bùi Đức Anh', email: 'ducanh.dev@gmail.com', avatarBgColor: 'bg-emerald-700', isLeader: false },
    { id: 3, name: 'Thiều Quốc Đạt', email: 'quocdat.art@gmail.com', avatarBgColor: 'bg-cyan-600', isLeader: false },
  ]);

  const mapPins: MapPinItem[] = activities.map((act, index) => ({
    id: act.id,
    index: index + 1,
    title: act.title,
    category: act.category[0] || 'Khám phá',
    address: act.address,
    rating: act.rating,
    imageUrl: act.imageUrl,
    isVisited: act.isVisited,
    top: act.top,
    left: act.left,
  }));

  const handleSelectActivity = (act: typeof activities[0]) => {
    openModal({
      id: act.id,
      title: act.title,
      category: act.category[0] || 'Khám phá',
      address: act.address,
      rating: act.rating,
      imageUrl: act.imageUrl,
      isVisited: act.isVisited,
    });
  };

  const handleAddLocation = (loc: LocationSuggestion) => {
    setActivities([
      ...activities,
      {
        id: Date.now(),
        title: loc.name,
        timeRange: '15:30 PM - 17:00 PM',
        category: ['Khám phá'],
        note: 'Địa điểm mới thêm',
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80',
        address: loc.address,
        rating: 4.5,
        isVisited: false,
        top: '60%',
        left: '50%',
      },
    ]);
  };

  const handleCreateNewTrip = (formData: NewTripFormData) => {
    setTripInfo({
      title: formData.title,
      location: formData.province,
      startDate: formData.startDate || '2026-11-07',
      endDate: formData.endDate || '2026-11-10',
      budget: '5,000,000 đ',
      isArchived: false,
      isCompleted: false,
    });
    alert(`Đã tạo thành công chuyến đi "${formData.title}" tại ${formData.province}!`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* CỘT TRÁI: Nội dung các Tab & Header */}
      <div className="w-full lg:w-[56%] xl:w-[57%] h-screen flex flex-col bg-white border-r border-slate-200">
        
        {/* Header & Tabs Navigation */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex flex-col gap-4 bg-white z-10 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <Link
              href="/my-trips"
              className="text-xs font-bold text-teal-700 hover:underline mb-2 inline-block"
            >
              ← Quay lại danh sách chuyến đi
            </Link>
          </div>
          <TripHeaderCard
            title={tripInfo.title}
            subtitle={tripInfo.location}
            dateRange="7/11 - 10/11"
            bannerUrl="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
          />
          <TripTabsNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>

        {/* Nội dung chi tiết từng Tab */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-5 custom-scrollbar">
          
          {activeTab === 'timeline' && (
            <ItineraryTab
              currentDate="7/11"
              activities={activities}
              selectedPlaceId={selectedPlace?.id}
              onSelectActivity={handleSelectActivity}
              onAddLocation={handleAddLocation}
            />
          )}

          {activeTab === 'budget' && (
            <TripBudgetPanel
              fundBalance={fundBalance}
              expenses={expenses}
              onUpdateBalance={(newVal) => setFundBalance(newVal)}
              onAddExpense={(newExp) => setExpenses([...expenses, { id: Date.now(), ...newExp }])}
              onDeleteExpense={(id) => setExpenses(expenses.filter((item) => item.id !== id))}
            />
          )}

          {activeTab === 'members' && (
            <TripMembersPanel
              members={members}
              inviteUrl={`http://TravelSync.com/invite/${id}`}
              onUpdateMember={(memberId, newName, newEmail) =>
                setMembers(members.map((m) => (m.id === memberId ? { ...m, name: newName, email: newEmail } : m)))
              }
              onDeleteMember={(memberId) => setMembers(members.filter((m) => m.id !== memberId))}
            />
          )}

          {activeTab === 'settings' && (
            <TripSettingsPanel
              initialTrip={tripInfo}
              onSaveSettings={(updated) => setTripInfo(updated)}
              onToggleArchive={() => setTripInfo((prev) => ({ ...prev, isArchived: !prev.isArchived }))}
              onToggleComplete={() => setTripInfo((prev) => ({ ...prev, isCompleted: !prev.isCompleted }))}
              onDeleteTrip={() => {
                if (confirm('Bạn có chắc chắn muốn xóa chuyến đi này không?')) {
                  alert('Đã xóa thành công!');
                }
              }}
            />
          )}

        </div>
      </div>

      {/* CỘT PHẢI: Bản đồ Map Workspace tương tác */}
      <div className="hidden lg:block lg:w-[44%] xl:w-[43%] h-screen relative">
        <MapWorkspacePanel pins={mapPins} />
      </div>

      {/* Modal Tạo chuyến đi mới */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNewTrip}
      />

    </div>
  );
}