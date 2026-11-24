'use client';

import { useMemo, useState } from 'react';
import { Compass, Plus, Search, Ticket } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import TripCard from '@/components/trips/TripCard';
import { CreateTripDashedCard } from '@/components/cards/TripCard';
import CreateTripModal from '@/components/trips/CreateTripModal';
import EditTripModal from '@/components/trips/EditTripModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { useDeleteTrip, useMyTrips } from '@/hooks/useTrips';
import type { TripResponse } from '@/types/trip';

type StatusFilter = 'ALL' | 'PLANNING' | 'COMPLETED';

export default function MyTripsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripResponse | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<TripResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trips, isLoading, isError, error, refetch } = useMyTrips();
  const deleteTripMutation = useDeleteTrip();

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    const q = searchQuery.trim().toLowerCase();
    return trips.filter((trip) => {
      if (statusFilter !== 'ALL' && trip.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${trip.name} ${trip.destinationName || ''} ${trip.description || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [trips, statusFilter, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!deletingTrip) return;
    try {
      await deleteTripMutation.mutateAsync(deletingTrip.tripId);
    } finally {
      setDeletingTrip(null);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col"
    >
      <Navbar
        activeTab="trips"
        onOpenCreateTrip={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-6 sm:px-10 pt-10 pb-20 space-y-6">
        {/* Page Header đồng bộ với /explore */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-[#0F172A]">
              Chuyến đi của tôi
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Quản lý lịch trình, tối ưu lộ trình bản đồ và ngân sách các hành trình của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-5 text-xs font-bold text-white shadow-sm shadow-teal-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tạo chuyến đi mới</span>
          </button>
        </div>

        {/* Bộ lọc & Tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#14B8A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên chuyến đi hoặc tỉnh thành..."
              className="w-full h-10 rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-3.5 text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:border-[#14B8A6] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PLANNING', label: 'Đang lên lịch' },
                { id: 'COMPLETED', label: 'Hoàn thành' },
              ] as const
            ).map((opt) => {
              const isActive = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-slate-100 text-[#64748B] hover:bg-slate-200 hover:text-[#0F172A]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thống kê tổng số chuyến đi */}
        {!isLoading && !isError && trips && (
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#64748B] uppercase tracking-wider px-1">
            <Ticket className="w-4 h-4 text-[#14B8A6]" />
            <span>
              Hiển thị{' '}
              <span className="text-[#0F766E] font-black tabular-nums">
                {filteredTrips.length}
              </span>{' '}
              / {trips.length} chuyến đi
            </span>
          </div>
        )}

        {/* Content Body */}
        <div>
          {/* Loading Skeleton đồng bộ ExploreCard */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[340px] rounded-[22px] border border-[#E2E8F0] bg-white overflow-hidden animate-pulse flex flex-col"
                >
                  <div className="h-[165px] bg-slate-200" />
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                    <div className="h-10 w-full bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="text-sm font-semibold text-rose-700">
                Không thể tải danh sách chuyến đi: {error?.message || 'Lỗi kết nối'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty State (chưa có chuyến đi nào) */}
          {!isLoading && !isError && (!trips || trips.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 py-16 px-6 text-center bg-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#14B8A6] mb-4">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">
                Chưa có chuyến đi nào
              </h3>
              <p className="mt-1.5 max-w-sm text-xs text-[#64748B] leading-relaxed">
                Bắt đầu lên kế hoạch cho hành trình khám phá địa điểm mới bằng cách tạo chuyến đi đầu tiên.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Bắt đầu tạo chuyến đi</span>
              </button>
            </div>
          )}

          {/* Empty Filter Result */}
          {!isLoading &&
            !isError &&
            trips &&
            trips.length > 0 &&
            filteredTrips.length === 0 && (
              <div className="rounded-[22px] border border-[#E2E8F0] bg-white py-14 px-6 text-center space-y-3">
                <p className="text-sm font-bold text-[#0F172A]">
                  Không có chuyến đi nào khớp bộ lọc hiện tại
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0F766E] hover:bg-teal-50 cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}

          {/* Trips Grid */}
          {!isLoading && !isError && filteredTrips.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip.tripId}
                  trip={trip}
                  onEdit={(target) => setEditingTrip(target)}
                  onDelete={(target) => setDeletingTrip(target)}
                />
              ))}
              <CreateTripDashedCard onClick={() => setIsCreateModalOpen(true)} />
            </div>
          )}
        </div>
      </main>

      {/* Modal Tạo chuyến đi mới (POST /api/v1/trips) */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Modal Chỉnh sửa chuyến đi (PUT /api/v1/trips/{id}) */}
      <EditTripModal
        isOpen={Boolean(editingTrip)}
        trip={editingTrip}
        onClose={() => setEditingTrip(null)}
      />

      {/* Modal Xác nhận xóa chuyến đi (DELETE /api/v1/trips/{id}) */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTrip)}
        onClose={() => setDeletingTrip(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
