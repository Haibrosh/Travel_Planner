'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTrip } from '@/hooks/useTrips';
import {
  useAddItineraryItemMutation,
  useDeleteItineraryItemMutation,
  useItineraryQuery,
  useOptimizeDayRouteMutation,
  useReorderItineraryMutation,
  useUpdateItineraryItemMutation,
} from '@/hooks/useItinerary';
import { useTripUiStore } from '@/store/useTripUiStore';
import { useMapStore } from '@/store/useMapStore';
import {
  CATEGORY_LABEL_MAP,
  getPlaceFallbackImage,
} from '@/services/explore.service';
import type { Place as ExplorePlace } from '@/types/explore';
import type { ItineraryItemResponse } from '@/services/itinerary.service';
import { TripHeaderCard } from '@/components/trip-workspace/TripHeaderCard';
import { TripTabsNav, TripTabType } from '@/components/trip-workspace/TripTabsNav';
import { ItineraryTab, ItineraryItem } from '@/components/trip-workspace/ItineraryTab';
import { TripBudgetPanel } from '@/components/trip-workspace/TripBudgetPanel';
import { ChecklistTab, ChecklistItem } from '@/components/trip-workspace/ChecklistTab';
import { TripMembersPanel, MemberItem } from '@/components/trip-workspace/TripMembersPanel';
import { TripSettingsPanel, TripSettingsData } from '@/components/trip-workspace/TripSettingsPanel';
import { MapWorkspacePanel, MapPinItem } from '@/components/trip-workspace/MapWorkspacePanel';
import { LocationSuggestion } from '@/components/trip-workspace/AddLocationBar';
import { CreateTripModal, NewTripFormData } from '@/components/modals/CreateTripModal';
import { ExpenseItem } from '@/components/cards/TotalExpenseCard';

interface PageProps {
  params: Promise<{ id: string }>;
}

function mapApiItemToActivity(item: ItineraryItemResponse, idx: number): ItineraryItem {
  const { place } = item;
  const timeRange =
    item.startTime && item.endTime
      ? `${item.startTime} - ${item.endTime}`
      : item.startTime
        ? `Từ ${item.startTime}`
        : item.endTime
          ? `Đến ${item.endTime}`
          : '8:00 AM - 9:30 AM';

  return {
    id: item.itemId,
    title: place.name,
    timeRange,
    category: [
      CATEGORY_LABEL_MAP[place.category] || place.subcategory || 'Tham quan',
    ],
    note: item.note ?? '',
    imageUrl: place.photoUrl || getPlaceFallbackImage(place.category),
    address: place.address || '',
    rating: place.rating ?? undefined,
    isVisited: false,
    top: `${28 + ((idx * 14) % 45)}%`,
    left: `${35 + ((idx * 17) % 40)}%`,
    rawItem: item,
  };
}

export default function TripWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const { data: trip, isLoading, isError, error } = useTrip(id);
  const { selectedDayNumber, setSelectedTripId } = useTripUiStore();
  const { selectedPlace, openModal } = useMapStore();

  useEffect(() => {
    if (id) {
      setSelectedTripId(id);
    }
  }, [id, setSelectedTripId]);

  const numericTripId = Number(id);
  const validTripId = !Number.isNaN(numericTripId) ? numericTripId : 0;

  const { data: itineraryItems = [] } = useItineraryQuery(validTripId);
  const addItemMutation = useAddItineraryItemMutation(validTripId);
  const updateItemMutation = useUpdateItineraryItemMutation(validTripId);
  const deleteItemMutation = useDeleteItineraryItemMutation(validTripId);
  const reorderMutation = useReorderItineraryMutation(validTripId);
  const optimizeRouteMutation = useOptimizeDayRouteMutation(validTripId);

  const [activeTab, setActiveTab] = useState<TripTabType>('timeline');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilteredByMap, setIsFilteredByMap] = useState(false);

  const [fundBalance, setFundBalance] = useState(10000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 1, title: 'Thuê xe di chuyển', amount: 150000, category: 'Di chuyển', paidBy: 'Thành viên 1' },
  ]);

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: 1, name: 'CCCD / Giấy tờ tùy thân', checked: true },
    { id: 2, name: 'Sạc điện thoại & Pin dự phòng', checked: true },
    { id: 3, name: 'Áo khoác & Trang phục phù hợp thời tiết', checked: false },
    { id: 4, name: 'Kem chống nắng & Đồ dùng cá nhân', checked: false },
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

  const dayApiItems = useMemo(
    () =>
      itineraryItems
        .filter((item) => item.dayNumber === selectedDayNumber)
        .sort((a, b) => a.positionIndex - b.positionIndex),
    [itineraryItems, selectedDayNumber]
  );

  const activities = useMemo<ItineraryItem[]>(
    () => dayApiItems.map((item, idx) => mapApiItemToActivity(item, idx)),
    [dayApiItems]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
        <p className="text-sm font-bold text-slate-500 animate-pulse">
          Đang tải không gian chuyến đi...
        </p>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 bg-slate-50 text-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-md w-full shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Không tìm thấy chuyến đi</h2>
          <p className="mt-1 text-xs text-slate-500">
            {error?.message || 'Đã xảy ra lỗi khi kết nối dữ liệu.'}
          </p>
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
  const displayedActivities = isFilteredByMap ? activities.slice(0, 1) : activities;

  const mapPins: MapPinItem[] = displayedActivities.map((act, index) => ({
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
    const numericPlaceId = Number(loc.id);
    if (!Number.isNaN(numericPlaceId) && numericPlaceId > 0) {
      const snapshot: ExplorePlace = {
        placeId: numericPlaceId,
        name: loc.name,
        category: 'attraction',
        address: loc.address || '',
        photoUrl: getPlaceFallbackImage('attraction'),
        rating: null,
        reviewCount: 0,
      };
      addItemMutation.mutate({
        tripId: trip.tripId,
        placeId: numericPlaceId,
        dayNumber: selectedDayNumber,
        placeSnapshot: snapshot,
      });
    }
  };

  const handleReorderActivities = (newActs: ItineraryItem[]) => {
    const orderedIds = newActs.map((a) => Number(a.id));
    const reorderedApi = [...dayApiItems]
      .sort((a, b) => orderedIds.indexOf(a.itemId) - orderedIds.indexOf(b.itemId))
      .map((item, idx) => ({
        ...item,
        orderIndex: idx + 1,
        positionIndex: idx + 1,
      }));

    if (reorderedApi.length === 0) return;
    const moved = reorderedApi[0];
    const otherDays = itineraryItems.filter((i) => i.dayNumber !== selectedDayNumber);

    reorderMutation.mutate({
      tripId: trip.tripId,
      items: reorderedApi.map((i) => ({
        itemId: i.itemId,
        dayNumber: selectedDayNumber,
        orderIndex: i.orderIndex,
      })),
      movedItemId: moved.itemId,
      targetDayNumber: selectedDayNumber,
      prevItemId: null,
      nextItemId: reorderedApi[1]?.itemId ?? null,
      orderIndex: 1,
      optimisticItems: [...otherDays, ...reorderedApi],
    });
  };

  const handleDeleteActivity = (itemId: string | number) => {
    const numericItemId = Number(itemId);
    if (!Number.isNaN(numericItemId) && numericItemId > 0) {
      deleteItemMutation.mutate({
        tripId: trip.tripId,
        itemId: numericItemId,
      });
    }
  };

  const handleUpdateActivity = (
    itemId: string | number,
    updatedData: { timeRange?: string; note?: string }
  ) => {
    const numericItemId = Number(itemId);
    if (!Number.isNaN(numericItemId) && numericItemId > 0) {
      const existing = itineraryItems.find((i) => i.itemId === numericItemId);
      updateItemMutation.mutate({
        tripId: trip.tripId,
        itemId: numericItemId,
        startTime: existing?.startTime ?? null,
        endTime: existing?.endTime ?? null,
        note: updatedData.note !== undefined ? updatedData.note : existing?.note ?? '',
      });
    }
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
            onBack={() => {
              window.location.href = '/my-trips';
            }}
          />
          <TripTabsNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-5 custom-scrollbar">
          {activeTab === 'timeline' && (
            <ItineraryTab
              trip={trip}
              currentDate={formatDateVN(trip.startDate)}
              activities={activities}
              selectedPlaceId={selectedPlace?.id}
              onSelectActivity={handleSelectActivity}
              onAddLocation={handleAddLocation}
              onReorderActivities={handleReorderActivities}
              onDeleteActivity={handleDeleteActivity}
              onUpdateActivity={handleUpdateActivity}
              isFilteredByMap={isFilteredByMap}
              onToggleMapFilter={() => setIsFilteredByMap((prev) => !prev)}
              onOptimizeRoute={() => {
                if (dayApiItems.length >= 2) {
                  optimizeRouteMutation.mutate({
                    tripId: trip.tripId,
                    dayNumber: selectedDayNumber,
                  });
                }
              }}
            />
          )}

          {activeTab === 'budget' && (
            <TripBudgetPanel
              fundBalance={fundBalance}
              expenses={expenses}
              onUpdateBalance={(newVal) => setFundBalance(newVal)}
              onAddExpense={(newExp) =>
                setExpenses([...expenses, { id: Date.now(), ...newExp }])
              }
              onDeleteExpense={(expId) =>
                setExpenses(expenses.filter((item) => item.id !== expId))
              }
            />
          )}

          {activeTab === 'checklist' && (
            <ChecklistTab
              items={checklistItems}
              onToggleItem={(itemId, nextChecked) =>
                setChecklistItems((prev) =>
                  prev.map((item) =>
                    item.id === itemId ? { ...item, checked: nextChecked } : item
                  )
                )
              }
              onAddItem={(name) =>
                setChecklistItems((prev) => [
                  ...prev,
                  { id: Date.now(), name, checked: false },
                ])
              }
              onDeleteItem={(itemId) =>
                setChecklistItems((prev) => prev.filter((item) => item.id !== itemId))
              }
            />
          )}

          {activeTab === 'members' && (
            <TripMembersPanel
              members={members}
              inviteUrl={`http://TravelSync.com/invite/${id}`}
              onUpdateMember={(memberId, newName, newEmail) =>
                setMembers(
                  members.map((m) =>
                    m.id === memberId ? { ...m, name: newName, email: newEmail } : m
                  )
                )
              }
              onDeleteMember={(memberId) =>
                setMembers(members.filter((m) => m.id !== memberId))
              }
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