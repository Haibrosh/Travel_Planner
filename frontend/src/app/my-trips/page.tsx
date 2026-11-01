'use client';

import { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import TripCard from '@/components/trips/TripCard';
import CreateTripModal from '@/components/trips/CreateTripModal';
import { useMyTrips } from '@/hooks/useTrips';

export default function MyTripsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: trips, isLoading, isError, error, refetch } = useMyTrips();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar onOpenCreateTrip={() => setIsCreateModalOpen(true)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Chuyến đi của tôi
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Quản lý và theo dõi các hành trình du lịch của bạn
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tạo chuyến đi mới
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-8">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-zinc-200 bg-white p-5 animate-pulse dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-6 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-400">
                Không thể tải danh sách chuyến đi: {error?.message || 'Lỗi kết nối'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && (!trips || trips.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 px-6 text-center dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-zinc-800 mb-4">
                🗺️
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Chưa có chuyến đi nào
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                Bắt đầu lên kế hoạch cho hành trình khám phá địa điểm mới bằng cách tạo chuyến đi đầu tiên.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-5 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                + Bắt đầu tạo chuyến đi
              </button>
            </div>
          )}

          {/* Trips Grid */}
          {!isLoading && !isError && trips && trips.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
