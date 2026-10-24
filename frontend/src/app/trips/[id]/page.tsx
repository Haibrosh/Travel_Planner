'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useTrip } from '@/hooks/useTrips';
import { useTripUiStore, type TripTab } from '@/store/useTripUiStore';
import ItineraryTab from '@/components/trips/workspace/ItineraryTab';
import BudgetTab from '@/components/trips/workspace/BudgetTab';
import ChecklistTab from '@/components/trips/workspace/ChecklistTab';
import CollabTab from '@/components/trips/workspace/CollabTab';

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
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Navigation & Workspace Header */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: Back button & Trip info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/my-trips"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Quay lại danh sách"
            >
              ←
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {trip.name}
                </h1>
                <span className="hidden sm:inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                  📍 Điểm đến #{trip.destinationId}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {trip.startDate} – {trip.endDate} • Tạo bởi @{trip.ownerUsername}
              </p>
            </div>
          </div>

          {/* Center: 4 Tab Switcher */}
          <div className="hidden md:flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('collab')}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Chia sẻ
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-t border-zinc-200 px-2 py-1 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 shrink-0 py-1.5 text-center text-xs font-medium rounded ${
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
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'itinerary' && <ItineraryTab trip={trip} />}
        {activeTab === 'budget' && <BudgetTab trip={trip} />}
        {activeTab === 'checklist' && <ChecklistTab />}
        {activeTab === 'collab' && <CollabTab trip={trip} />}
      </main>
    </div>
  );
}
