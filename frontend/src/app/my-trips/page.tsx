'use client';

import { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import TripCard from '@/components/trips/TripCard';
import { CreateTripModal, type NewTripFormData } from '@/components/modals/CreateTripModal';
import EditTripModal from '@/components/trips/EditTripModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { useDeleteTrip, useMyTrips } from '@/hooks/useTrips';
import type { TripResponse } from '@/types/trip';

export default function MyTripsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripResponse | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<TripResponse | null>(null);

  const { data: trips, isLoading, isError, error, refetch } = useMyTrips();
  const deleteTripMutation = useDeleteTrip();

  const handleCreateNewTrip = (_formData: NewTripFormData) => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deletingTrip) return;
    await deleteTripMutation.mutateAsync((deletingTrip as TripResponse & { tripId?: string | number }).tripId ?? '');
    setDeletingTrip(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Chuyến đi của tôi
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Quản lý lịch trình, ngân sách và thành viên các chuyến đi
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            + Tạo chuyến đi mới
          </button>
        </div>

        <div className="mt-8">
          {isLoading && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-zinc-200 bg-white p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded bg-zinc-100" />
                    <div className="h-6 w-3/4 rounded bg-zinc-100" />
                    <div className="h-3 w-1/2 rounded bg-zinc-100" />
                  </div>
                  <div className="h-4 w-full rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-800">
                Không thể tải danh sách chuyến đi: {error?.message || 'Lỗi kết nối'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {!isLoading && !isError && (!trips || trips.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 px-6 text-center bg-white/60">
              <p className="text-sm font-bold text-slate-700">Bạn chưa có chuyến đi nào</p>
              <p className="mt-1 text-xs text-slate-500">
                Bắt đầu tạo chuyến đi đầu tiên để lên lịch trình cùng bạn bè.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                + Tạo chuyến đi mới
              </button>
            </div>
          )}

          {!isLoading && !isError && trips && trips.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, index) => {
                const tripKey = (trip as TripResponse & { tripId?: string | number }).tripId ?? index;
                return (
                  <TripCard
                    key={tripKey}
                    trip={trip}
                    onEdit={() => setEditingTrip(trip)}
                    onDelete={() => setDeletingTrip(trip)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNewTrip}
      />

      <EditTripModal
        isOpen={Boolean(editingTrip)}
        trip={editingTrip}
        onClose={() => setEditingTrip(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingTrip)}
        onClose={() => setDeletingTrip(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}