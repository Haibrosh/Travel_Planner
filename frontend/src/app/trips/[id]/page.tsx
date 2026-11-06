'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useTrip } from '@/hooks/useTrips';
import { TripHeaderCard } from '@/components/trip-workspace/TripHeaderCard';
import { TripTabsNav, TripTabType } from '@/components/trip-workspace/TripTabsNav';
import { ItineraryTab, ItineraryItem } from '@/components/trip-workspace/ItineraryTab';
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
  const { data: trip, isLoading, isError, error } = useTrip(id);

  const [activeTab, setActiveTab] = useState<TripTabType>('timeline');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { selectedPlace, isModalOpen, openModal } = useMapStore();

  const [activities, setActivities] = useState<ItineraryItem[]>([
    {
      id: 1,
      title: 'Điểm tham quan trung tâm',
      timeRange: '8:00 AM - 9:30 AM',
      category: ['Tham quan'],
      note: 'Dạo chơi và chụp ảnh kỷ niệm',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      address: 'Khu vực trung tâm thành phố',
      rating: 4.6,
      isVisited: true,
      top: '40%',
      left: '45%',
    },
    {
      id: 2,
      title: 'Nhà thờ Con Gà',
      timeRange: '15:30 PM - 17:00 PM',
      category: ['Khám phá'],
      note: 'Địa điểm mới thêm',
      imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80',
      address: '15 Trần Phú, Phường 3, Đà Lạt',
      rating: 4.5,
      isVisited: false,
      top: '60%',
      left: '50%',
    },
  ]);

  const [fundBalance, setFundBalance] = useState(10000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 1, title: 'Thuê xe di chuyển', amount: 150000, category: 'Di chuyển', paidBy: 'Thành viên 1' },
  ]);

  const [members, setMembers] = useState<MemberItem[]>([
    { id: 1, name: 'Trưởng nhóm', email: 'leader@example.com', avatarBgColor: 'bg-teal-600', isLeader: true },
    { id: 2, name: 'Thành viên 1', email: 'member1@example.com', avatarBgColor: 'bg-emerald-700', isLeader: false },
  ]);

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Đang tải không gian chuyến đi...</p>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-md w-full shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Không tìm thấy chuyến đi</h2>
          <p className="mt-1 text-xs text-slate-500">{error?.message || 'Đã xảy ra lỗi khi kết nối dữ liệu.'}</p>
          <Link
            href="/my-trips"
            className="mt-5 inline-block rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
          >
            Quay lại danh sách chuyến đi
          </Link>
        </div>
      </div>
    );
  }

  const tripInfo: TripSettingsData = {
    title: trip.name,
    location: trip.description || 'Chưa có mô tả chuyến đi',
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: '10,000,000 đ',
    isArchived: trip.status === 'ARCHIVED',
    isCompleted: trip.status === 'COMPLETED',
  };

  const formattedDateRange = `${formatDateVN(trip.startDate)} - ${formatDateVN(trip.endDate)}`;

  const mapPins: MapPinItem[] = activities.map((act, index) => ({
    id: act.id,
    index: index + 1,
    title: act.title,
    category: act.category[0] || 'Khám phá',
    address: act.address || '',
    rating: act.rating,
    imageUrl: act.imageUrl,
    isVisited: act.isVisited,
    top: act.top || '50%',
    left: act.left || '50%',
  }));

  const handleSelectActivity = (act: ItineraryItem) => {
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
    alert(`Đã tạo thành công chuyến đi "${formData.title}" tại ${formData.province}!`);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* CỘT TRÁI */}
      <div className="w-full lg:w-[56%] xl:w-[57%] h-screen flex flex-col bg-white border-r border-slate-200">
        <div className="px-6 sm:px-8 pt-6 pb-4 flex flex-col gap-4 bg-white z-10 shrink-0 border-b border-slate-100">
          <TripHeaderCard
            title={tripInfo.title}
            subtitle={tripInfo.location}
            dateRange={formattedDateRange}
            bannerUrl="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
            onBack={() => { window.location.href = '/my-trips'; }}
          />
          <TripTabsNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-5 custom-scrollbar">
          {activeTab === 'timeline' && (
            <ItineraryTab
              currentDate={formatDateVN(trip.startDate)}
              activities={activities}
              selectedPlaceId={selectedPlace?.id}
              onSelectActivity={handleSelectActivity}
              onAddLocation={handleAddLocation}
              onReorderActivities={(newActs) => setActivities(newActs)}
              onDeleteActivity={(id: string | number) => {
                setActivities(activities.filter((item) => item.id !== id));
              }}
              onUpdateActivity={(id: string | number, updatedData: { timeRange?: string; note?: string }) => {
                setActivities(
                  activities.map((item) =>
                    item.id === id ? { ...item, ...updatedData } : item
                  )
                );
              }}
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
              onSaveSettings={() => {}}
              onToggleArchive={() => {}}
              onToggleComplete={() => {}}
              onDeleteTrip={() => {}}
            />
          )}
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="hidden lg:block lg:w-[44%] xl:w-[43%] h-screen relative">
        <MapWorkspacePanel pins={mapPins} />
      </div>

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNewTrip}
      />
    </div>
  );
}