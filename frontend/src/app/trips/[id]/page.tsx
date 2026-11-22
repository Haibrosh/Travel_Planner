'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  CheckSquare,
  MapPin,
  Share2,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
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

  const tabs: { key: TripTab; label: string; icon: LucideIcon }[] = [
    { key: 'itinerary', label: 'Lịch trình', icon: CalendarRange },
    { key: 'budget', label: 'Chi phí', icon: Wallet },
    { key: 'checklist', label: 'Hành lý', icon: CheckSquare },
    { key: 'collab', label: 'Cộng tác', icon: Users },
  ];

  if (isLoading) {
    return (
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="flex h-screen w-full flex-col bg-[#F8FAFC]"
      >
        <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center animate-pulse" />
        <div className="flex-1 p-8">
          <div className="h-8 w-64 rounded bg-slate-200 animate-pulse mb-4" />
          <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#F8FAFC] text-center"
      >
        <div className="rounded-[22px] border border-[#E2E8F0] bg-white p-8 max-w-md w-full shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0F172A]">
            Không tìm thấy chuyến đi
          </h2>
          <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
            {error?.message || 'Chuyến đi không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
          <Link
            href="/my-trips"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-4 py-2.5 text-xs font-bold text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách chuyến đi</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="flex h-screen flex-col bg-[#F8FAFC] overflow-hidden"
    >
      {/* Top Navigation & Workspace Header */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-3">
          {/* Left: Back button & Trip info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/my-trips"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0F172A] hover:border-teal-400 transition-colors"
              title="Quay lại danh sách chuyến đi"
              aria-label="Quay lại danh sách chuyến đi"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#0F172A] truncate">
                  {trip.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 text-[11px] font-bold text-[#0F766E] shrink-0">
                  <MapPin className="w-3 h-3 text-[#14B8A6]" />
                  <span>
                    {trip.destinationName ||
                      (trip.provinceCode
                        ? `Mã tỉnh #${trip.provinceCode}`
                        : `Điểm đến #${trip.destinationId ?? 1}`)}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] truncate tabular-nums">
                {trip.startDate} – {trip.endDate} • Tạo bởi @{trip.ownerUsername}
              </p>
            </div>
          </div>

          {/* Center: 4 Tab Switcher */}
          <div className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/70">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#14B8A6] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('collab')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:border-teal-400 hover:bg-teal-50/40 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-t border-slate-200/80 px-2 py-1.5 bg-[#F8FAFC] gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 shrink-0 py-1.5 px-2 inline-flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#14B8A6] text-white'
                    : 'text-[#64748B]'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
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
