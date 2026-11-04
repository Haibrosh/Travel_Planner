'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, NavTabType } from '@/components/layout/Navbar';
import { ExploreCategoryFilter, CategoryType } from '@/components/explore/ExploreCategoryFilter';
import { ExploreFilterBar } from '@/components/explore/ExploreFilterBar';
import { ExploreCard } from '@/components/cards/ExploreCard';
import { ExplorePagination } from '@/components/explore/ExplorePagination';
import { AddToTripModal } from '@/components/modals/AddToTripModal';
import { PlaceDetailModal, PlaceDetailData } from '@/components/modals/PlaceDetailModal';
import { PROVINCES_LIST } from '@/mocks/exploreData';
import { useDestinations, usePlaces } from '@/hooks/usePlaces';
import { useMyTrips } from '@/hooks/useTrips';
import type { Place } from '@/types/explore';

export default function ExplorePage() {
  const router = useRouter();
  const [currentNavTab, setCurrentNavTab] = useState<NavTabType>('explore');

  // State bộ lọc & sắp xếp
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [rawSearchQuery, setRawSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  // State phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;

  // State quản lý địa điểm đã ghé thăm
  const [visitedIds, setVisitedIds] = useState<Record<string, boolean>>({});

  // State quản lý Modal chi tiết địa điểm
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // State quản lý Modal Thêm vào chuyến đi
  const [isAddToTripOpen, setIsAddToTripOpen] = useState<boolean>(false);
  const [activePlaceTitle, setActivePlaceTitle] = useState<string>('');

  // Debounce 300ms cho ô tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(rawSearchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [rawSearchQuery]);

  // 1. Lấy danh sách tỉnh/thành từ API GET /api/v1/destinations
  const { data: destinations } = useDestinations();

  const provincesList = useMemo(() => {
    if (!destinations || destinations.length === 0) {
      return PROVINCES_LIST;
    }
    return ['Tất cả tỉnh thành', ...destinations.map((d) => d.name)];
  }, [destinations]);

  // Map tên tỉnh được chọn sang destinationId (provinceCode) để gửi lên API
  const selectedDestinationId = useMemo(() => {
    if (!selectedProvince) return undefined;
    const found = destinations?.find(
      (d) =>
        d.name.toLowerCase() === selectedProvince.toLowerCase() ||
        d.fullName?.toLowerCase() === selectedProvince.toLowerCase()
    );
    return found?.provinceCode || selectedProvince;
  }, [selectedProvince, destinations]);

  // 2. Lấy danh sách địa điểm từ API GET /api/v1/places
  const {
    data: placesPage,
    isLoading: isPlacesLoading,
    isFetching: isPlacesFetching,
  } = usePlaces({
    destinationId: selectedDestinationId,
    q: debouncedSearchQuery,
    category: activeCategory,
    sort: sortBy,
    page: currentPage,
    size: itemsPerPage,
  });

  // Lấy danh sách chuyến đi thật của user cho AddToTripModal
  const { data: myTrips } = useMyTrips();
  const userTripTitles = useMemo(() => {
    if (myTrips && myTrips.length > 0) {
      return myTrips.map((t) => t.name);
    }
    return undefined;
  }, [myTrips]);

  const currentPlaces = placesPage?.content ?? [];
  const totalElements = placesPage?.totalElements ?? 0;
  const totalPages = placesPage?.totalPages ?? 1;

  // Mở modal Thêm vào chuyến đi
  const handleOpenAddToTrip = (title: string) => {
    setActivePlaceTitle(title);
    setIsAddToTripOpen(true);
  };

  // Mở modal Chi tiết địa điểm
  const handleCardClick = (place: Place) => {
    const key = String(place.placeId);
    setSelectedPlaceDetail({
      id: place.placeId,
      title: place.name,
      category: place.subcategory || place.tags?.[0] || 'Khám phá',
      subcategory: place.subcategory,
      address: place.address,
      rating: place.rating ?? 4.8,
      reviewCount: place.reviewCount,
      imageUrl: place.photoUrl || undefined,
      description: place.description,
      openingHours: place.openingHours,
      phone: place.phone,
      website: place.website,
      price: place.price,
      latitude: place.latitude,
      longitude: place.longitude,
      isVisited: Boolean(visitedIds[key]),
    });
    setIsDetailOpen(true);
  };

  const handleCloseAllModals = () => {
    setIsDetailOpen(false);
    setSelectedPlaceDetail(null);
    setIsAddToTripOpen(false);
    setActivePlaceTitle('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* 1. Navbar */}
      <Navbar
        activeTab={currentNavTab}
        onTabChange={(tab: NavTabType) => {
          setCurrentNavTab(tab);
          if (tab === 'trips') {
            router.push('/my-trips');
          }
        }}
        onNotificationClick={() => alert('Mở thông báo')}
        onUserClick={() => router.push('/my-trips')}
        onLogoClick={() => router.push('/explore')}
      />

      {/* 2. Container chính */}
      <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 pt-10 pb-16 space-y-6">
        {/* Tiêu đề trang */}
        <div className="text-center space-y-2">
          <h1 className="text-[32px] sm:text-[38px] font-extrabold text-[#0F172A] tracking-tight">
            Khám phá các địa điểm du lịch
          </h1>
        </div>

        {/* Thanh tìm kiếm & Tỉnh thành */}
        <div className="pt-2">
          <ExploreFilterBar
            selectedProvince={selectedProvince}
            onSelectProvince={(prov: string) => {
              setSelectedProvince(prov);
              setCurrentPage(1);
            }}
            searchQuery={rawSearchQuery}
            onSearchChange={(query: string) => setRawSearchQuery(query)}
            provincesList={provincesList}
          />
        </div>

        {/* Thanh chip phân loại danh mục */}
        <div className="max-w-[900px] mx-auto pt-2">
          <ExploreCategoryFilter
            activeCategory={activeCategory}
            onSelectCategory={(catId: CategoryType) => {
              setActiveCategory(catId);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Thống kê kết quả & Bộ chọn Sắp xếp */}
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 px-1 pt-4">
          <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
            Tìm thấy <span className="text-[#14B8A6] font-black">{totalElements}</span> địa điểm phù hợp
            {isPlacesFetching && !isPlacesLoading && (
              <span className="ml-2 text-[11px] font-medium text-teal-600 normal-case">
                (Đang cập nhật...)
              </span>
            )}
          </span>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#64748B]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] shadow-2xs focus:border-[#14B8A6] focus:outline-none cursor-pointer"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="rating_desc">Đánh giá cao nhất</option>
              <option value="name_asc">Tên A → Z</option>
            </select>
          </div>
        </div>

        {/* Lưới thẻ địa điểm */}
        {isPlacesLoading ? (
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="h-[360px] rounded-[22px] border border-[#E2E8F0] bg-white overflow-hidden animate-pulse flex flex-col"
              >
                <div className="h-[180px] bg-slate-200" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-10 w-full bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {currentPlaces.length > 0 ? (
              currentPlaces.map((place: Place) => (
                <ExploreCard
                  key={place.placeId}
                  id={place.placeId}
                  title={place.name}
                  imageUrl={
                    place.photoUrl ||
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
                  }
                  tags={place.tags && place.tags.length > 0 ? place.tags : [place.subcategory || 'Khám phá']}
                  address={place.address}
                  onAddToTrip={() => handleOpenAddToTrip(place.name)}
                  onClick={() => handleCardClick(place)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-[#E2E8F0] text-slate-400 text-sm font-medium shadow-xs">
                Không tìm thấy địa điểm phù hợp với từ khóa hoặc bộ lọc của bạn.
              </div>
            )}
          </div>
        )}

        {/* 3. Thanh phân trang */}
        <div className="pt-6">
          <ExplorePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </main>

      {/* 4. Modal Chi tiết Địa điểm */}
      <PlaceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        place={selectedPlaceDetail}
        onToggleVisited={(placeId: string | number) => {
          const key = String(placeId);
          const nextVisited = !visitedIds[key];
          setVisitedIds((prev) => ({ ...prev, [key]: nextVisited }));
          if (selectedPlaceDetail) {
            setSelectedPlaceDetail({
              ...selectedPlaceDetail,
              isVisited: nextVisited,
            });
          }
        }}
        onAddToTrip={(detail) => {
          handleOpenAddToTrip(detail.title);
        }}
      />

      {/* 5. Modal Thêm vào chuyến đi */}
      <AddToTripModal
        isOpen={isAddToTripOpen}
        onClose={() => {
          setIsAddToTripOpen(false);
          setActivePlaceTitle('');
        }}
        locationTitle={activePlaceTitle}
        trips={userTripTitles}
        onSave={(trip: string, date: string) => {
          alert(`Đã thêm "${activePlaceTitle}" vào chuyến đi "${trip}" (Ngày ${date}) thành công!`);
          handleCloseAllModals();
        }}
      />
    </div>
  );
}
