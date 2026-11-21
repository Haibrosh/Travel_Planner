'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTrip } from '@/hooks/useTrips';
import { useTripUiStore, type TripTab } from '@/store/useTripUiStore';
import { ItineraryTab } from '@/components/trip-workspace/ItineraryTab';
import { TripBudgetPanel } from '@/components/trip-workspace/TripBudgetPanel';
import { TripMembersPanel, type MemberItem } from '@/components/trip-workspace/TripMembersPanel';
import { ChecklistTab, type ChecklistItem } from '@/components/trip-workspace/ChecklistTab';
import type { ExpenseItem } from '@/components/cards/TotalExpenseCard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const { data: trip, isLoading, isError, error } = useTrip(id);
  const { activeTab, setActiveTab, setSelectedTripId } = useTripUiStore();

  useEffect(() => {
    if (id) {
      setSelectedTripId(id);
    }
  }, [id, setSelectedTripId]);

  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: 1,
      title: 'Thuê xe di chuyển',
      amount: 150000,
      category: 'Di chuyển',
      paidBy: 'Thành viên 1',
    },
  ]);

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: 1, name: 'CCCD / Giấy tờ tùy thân', checked: true },
    { id: 2, name: 'Sạc điện thoại & Pin dự phòng', checked: true },
    { id: 3, name: 'Áo khoác & Trang phục phù hợp thời tiết', checked: false },
    { id: 4, name: 'Kem chống nắng & Đồ dùng cá nhân', checked: false },
  ]);

  const [members, setMembers] = useState<MemberItem[]>([
    {
      id: 1,
      name: 'Trưởng nhóm',
      email: 'leader@example.com',
      avatarBgColor: 'bg-teal-600',
      isLeader: true,
    },
    {
      id: 2,
      name: 'Thành viên 1',
      email: 'member1@example.com',
      avatarBgColor: 'bg-emerald-700',
      isLeader: false,
    },
  ]);

  const tabs: { key: TripTab; label: string; icon: string }[] = [
    { key: 'itinerary', label: 'Lịch trình', icon: '📅' },
    { key: 'budget', label: 'Chi phí', icon: '💰' },
    { key: 'checklist', label: 'Hành lý', icon: '🧳' },
    { key: 'collab', label: 'Cộng tác', icon: '👥' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950">
        <div className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center animate-pulse dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="flex-1 p-8">
          <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4" />
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-center">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 max-w-md w-full shadow-xs">
          <span className="text-3xl mb-3 block">⚠️</span>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Không tìm thấy chuyến đi
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {error?.message || 'Chuyến đi không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
          <Link
            href="/my-trips"
            className="mt-5 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            ← Quay lại danh sách chuyến đi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="sticky top-0 z-30 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/my-trips"
              className="text-xs font-bold text-teal-700 hover:underline shrink-0"
            >
              ← Chuyến đi
            </Link>
            <h1 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50 truncate">
              {trip.name}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#14B8A6] text-white'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-t border-zinc-200 px-2 py-1 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 shrink-0 py-1.5 text-center text-xs font-medium rounded cursor-pointer ${
                  isActive
                    ? 'font-bold text-zinc-900 border-b-2 border-zinc-900 dark:text-zinc-50 dark:border-zinc-50'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          {activeTab === 'itinerary' && <ItineraryTab trip={trip} />}

          {activeTab === 'budget' && (
            <TripBudgetPanel
              expenses={expenses}
              onAddExpense={(newExp) =>
                setExpenses((prev) => [{ id: Date.now(), ...newExp }, ...prev])
              }
              onDeleteExpense={(expId) =>
                setExpenses((prev) => prev.filter((item) => item.id !== expId))
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

          {activeTab === 'collab' && (
            <TripMembersPanel
              members={members}
              inviteUrl={`http://TravelSync.com/invite/${id}`}
              onUpdateMember={(memberId, newName, newEmail) =>
                setMembers((prev) =>
                  prev.map((m) =>
                    m.id === memberId ? { ...m, name: newName, email: newEmail } : m
                  )
                )
              }
              onDeleteMember={(memberId) =>
                setMembers((prev) => prev.filter((m) => m.id !== memberId))
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}