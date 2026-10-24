'use client';

import React, { useState } from 'react';
import { TripHeaderCard } from '@/components/trip-workspace/TripHeaderCard';
import { TripTabsNav, TripTabType } from '@/components/trip-workspace/TripTabsNav';
import { TripDateFilter } from '@/components/trip-workspace/TripDateFilter';
import { TripActivityCard } from '@/components/cards/TripActivityCard';
import { AddLocationBar, LocationSuggestion } from '@/components/trip-workspace/AddLocationBar';
import { MapWorkspacePanel } from '@/components/trip-workspace/MapWorkspacePanel';

import { GroupFundCard } from '@/components/cards/GroupFundCard';
import { TotalExpenseCard, ExpenseItem } from '@/components/cards/TotalExpenseCard';
import { TripMembersPanel, MemberItem } from '@/components/trip-workspace/TripMembersPanel';
import { TripSettingsPanel, TripSettingsData } from '@/components/trip-workspace/TripSettingsPanel';

export default function TripWorkspacePage() {
  const [activeTab, setActiveTab] = useState<TripTabType>('timeline');

  // State chung của chuyến đi (dùng cho Header và Tab Cài đặt)
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
    },
    {
      id: 2,
      title: 'Vườn hoa Thành phố Đà Lạt',
      timeRange: '9:45 AM - 11:00 AM',
      category: ['Tham quan', 'Chụp ảnh'],
      note: 'Chụp ảnh kỷ niệm',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    },
  ]);

  // 2. State Tab Chi tiêu
  const [fundBalance, setFundBalance] = useState(10000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 1, title: 'Thuê xe đạp đôi', amount: 150000, category: 'Di chuyển', paidBy: 'Trí Viễn' },
    { id: 2, title: 'Ăn trưa Phố cổ', amount: 850000, category: 'Ăn uống', paidBy: 'Quốc Đạt' },
    { id: 3, title: 'Vé vào cổng Vườn hoa', amount: 2500000, category: 'Tham quan', paidBy: 'Đức Anh' },
  ]);

  // 3. State Tab Bạn bè (Members)
  const [members, setMembers] = useState<MemberItem[]>([
    { id: 1, name: 'Đỗ Trí Viễn', email: 'viento.it@gmail.com', avatarBgColor: 'bg-teal-600', isLeader: true },
    { id: 2, name: 'Bùi Đức Anh', email: 'ducanh.dev@gmail.com', avatarBgColor: 'bg-emerald-700', isLeader: false },
    { id: 3, name: 'Thiều Quốc Đạt', email: 'quocdat.art@gmail.com', avatarBgColor: 'bg-cyan-600', isLeader: false },
  ]);

  // Các hàm xử lý (Handlers)
  const handleAddLocation = (loc: LocationSuggestion) => {
    setActivities([
      ...activities,
      {
        id: Date.now(),
        title: loc.name,
        timeRange: '15:30 PM - 17:00 PM',
        category: ['Khám phá'],
        note: 'Địa điểm mới',
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80',
      },
    ]);
  };

  const handleAddExpense = (newExp: Omit<ExpenseItem, 'id'>) => {
    setExpenses([...expenses, { id: Date.now(), ...newExp }]);
  };

  const handleDeleteExpense = (id: string | number) => {
    setExpenses(expenses.filter((item) => item.id !== id));
  };

  const handleUpdateMember = (id: string | number, newName: string, newEmail: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, name: newName, email: newEmail } : m))
    );
  };

  const handleDeleteMember = (id: string | number) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSaveSettings = (updatedData: TripSettingsData) => {
    setTripInfo(updatedData);
  };

  const handleToggleArchive = () => {
    setTripInfo((prev: TripSettingsData) => ({ ...prev, isArchived: !prev.isArchived }));
  };

  const handleToggleComplete = () => {
    setTripInfo((prev: TripSettingsData) => ({ ...prev, isCompleted: !prev.isCompleted }));
  };

  const handleDeleteTrip = () => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn chuyến đi này không?')) {
      alert('Đã xóa chuyến đi thành công!');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ================= CỘT TRÁI ================= */}
      <div className="w-full lg:w-[56%] xl:w-[57%] h-screen flex flex-col bg-white border-r border-slate-200">
        
        {/* Header & Tabs Cố định */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex flex-col gap-4 bg-white z-10 shrink-0 border-b border-slate-100">
          <TripHeaderCard
            title={tripInfo.title}
            subtitle={tripInfo.location}
            dateRange="7/11 - 10/11"
            bannerUrl="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
          />
          <TripTabsNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>

        {/* Nội dung thay đổi linh hoạt theo Tab đang active */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-5 custom-scrollbar">
          
          {/* TAB 1: LỊCH TRÌNH (TIMELINE) */}
          {activeTab === 'timeline' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <TripDateFilter currentDate="7/11" />
              
              <div className="flex flex-col gap-4">
                {activities.map((act, idx) => (
                  <TripActivityCard
                    key={act.id}
                    index={idx + 1}
                    title={act.title}
                    timeRange={act.timeRange}
                    tags={act.category}
                    note={act.note}
                    imageUrl={act.imageUrl}
                  />
                ))}
              </div>

              <div className="mt-2 pb-8">
                <AddLocationBar onSelectLocation={handleAddLocation} />
              </div>
            </div>
          )}

          {/* TAB 2: CHI TIÊU (BUDGET) */}
          {activeTab === 'budget' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200 pb-8">
              <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
                CHI TIÊU
              </h2>

              <GroupFundCard
                initialBalance={fundBalance}
                onSaveBalance={(newVal) => setFundBalance(newVal)}
              />

              <TotalExpenseCard
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>
          )}

          {/* TAB 3: BẠN BÈ (MEMBERS) */}
          {activeTab === 'members' && (
            <TripMembersPanel
              members={members}
              inviteUrl="http://TravelSync.com/invite/dalat-trip-2026"
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {/* TAB 4: CÀI ĐẶT (SETTINGS) */}
          {activeTab === 'settings' && (
            <TripSettingsPanel
              initialTrip={tripInfo}
              onSaveSettings={handleSaveSettings}
              onToggleArchive={handleToggleArchive}
              onToggleComplete={handleToggleComplete}
              onDeleteTrip={handleDeleteTrip}
            />
          )}

        </div>

      </div>

      {/* ================= CỘT PHẢI (BẢN ĐỒ MAP WORKSPACE) ================= */}
      <div className="hidden lg:block lg:w-[44%] xl:w-[43%] h-screen">
        <MapWorkspacePanel />
      </div>

    </div>
  );
}