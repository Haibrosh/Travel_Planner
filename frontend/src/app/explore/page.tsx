'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';
import { Navbar, NavTabType } from '@/components/layout/Navbar';
import { ExploreCategoryFilter, CategoryType } from '@/components/explore/ExploreCategoryFilter';
import { ExploreFilterBar } from '@/components/explore/ExploreFilterBar';
import { ExploreCard } from '@/components/cards/ExploreCard';
import { ExplorePagination } from '@/components/explore/ExplorePagination';
import { AddToTripModal, type AddToTripSelection } from '@/components/modals/AddToTripModal';
import { PlaceDetailModal, PlaceDetailData } from '@/components/modals/PlaceDetailModal';
import { PROVINCES_LIST } from '@/mocks/exploreData';
import { useDestinations, usePlaces } from '@/hooks/usePlaces';
import { useMyTrips } from '@/hooks/useTrips';
import { useAddItineraryItemMutation } from '@/hooks/useItinerary';
import { getPlaceFallbackImage } from '@/services/explore.service';
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
  const itemsPerPage = 8;

  // State quản lý địa điểm đã ghé thăm
  const [visitedIds, setVisitedIds] = useState<Record<string, boolean>>({});

  // State quản lý Modal chi tiết địa điểm
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // State quản lý Modal Thêm vào chuyến đi
  const [isAddToTripOpen, setIsAddToTripOpen] = useState<boolean>(false);
  const [activePlace, setActivePlace] = useState<Place | null>(null);

  // Thông báo thêm địa điểm thành công
  const [addedToast, setAddedToast] = useState<{
    placeName: string;
    tripId: number;
    tripName: string;
    dayLabel: string;
  } | null>(null);

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

  // 3. Lấy danh sách chuyến đi thật của user & mutation thêm vào lịch trình
  const { data: myTrips } = useMyTrips();
  const addItineraryItemMutation = useAddItineraryItemMutation();

  const currentPlaces = placesPage?.content ?? [];
  const totalElements = placesPage?.totalElements ?? 0;
  const totalPages = placesPage?.totalPages ?? 1;

  // Mở modal Thêm vào chuyến đi với đầy đủ thông tin Place từ places_v2
  const handleOpenAddToTrip = (place: Place) => {
    setActivePlace(place);
    setIsAddToTripOpen(true);
  };

  // Mở modal Chi tiết địa điểm (giữ nguyên rating = null khi chưa có đánh giá)
  const handleCardClick = (place: Place) => {
    const key = String(place.placeId);
    setSelectedPlaceDetail({
      id: place.placeId,
      title: place.name,
      category: place.category,
      subcategory: place.subcategory || place.tags?.[0] || 'Khám phá',
      address: place.address,
      rating: place.rating,
      reviewCount: place.reviewCount,
      imageUrl: place.photoUrl || getPlaceFallbackImage(place.category),
      description: place.description,
      openingHours: place.openingHours,
      phone: place.phone,
      website: place.website,
      price: place.price,
      latitude: place.latitude,
      longitude: place.longitude,
      rankingScore: place.rankingScore,
      hasContent: place.hasContent,
      content: place.content,
      isVisited: Boolean(visitedIds[key]),
    });
    setIsDetailOpen(true);
  };

  const handleCloseAllModals = () => {
    setIsDetailOpen(false);
    setSelectedPlaceDetail(null);
    setIsAddToTripOpen(false);
    setActivePlace(null);
  };

  const handleSaveToItinerary = async (selection: AddToTripSelection) => {
    if (!activePlace) return;

    await addItineraryItemMutation.mutateAsync({
      tripId: selection.tripId,
      placeId: activePlace.placeId,
      dayNumber: selection.dayNumber,
      placeSnapshot: activePlace,
    });

    setAddedToast({
      placeName: activePlace.name,
      tripId: selection.tripId,
      tripName: selection.tripName,
      dayLabel: selection.dayLabel,
    });

    handleCloseAllModals();
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
        onNotificationClick={() => router.push('/my-trips')}
        onUserClick={() => router.push('/my-trips')}
        onLogoClick={() => router.push('/explore')}
      />

      {/* Toast thông báo khi vừa thêm địa điểm vào chuyến đi */}
      {addedToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md rounded-2xl border border-teal-200 bg-white p-4 shadow-xl flex items-start gap-3 animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-extrabold text-slate-900">
              Đã thêm &ldquo;{addedToast.placeName}&rdquo; vào lịch trình!
            </p>
            <p className="text-slate-500 mt-0.5">
              {addedToast.tripName} • <span className="font-semibold text-teal-700">{addedToast.dayLabel}</span>
            </p>
            <button
              type="button"
              onClick={() => router.push(`/trips/${addedToast.tripId}`)}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700 transition-colors cursor-pointer"
            >
              <span>Mở lịch trình chuyến đi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAddedToast(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

        {/* Thanh chip phân loại danh mục (4 mã category của places_v2) */}
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
            Tìm thấy <span className="text-[#14B8A6] font-black">{totalElements.toLocaleString('vi-VN')}</span> địa điểm phù hợp
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
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
                  imageUrl={place.photoUrl || getPlaceFallbackImage(place.category)}
                  category={place.category}
                  rating={place.rating}
                  reviewCount={place.reviewCount}
                  hasContent={place.hasContent}
                  tags={
                    place.tags && place.tags.length > 0
                      ? place.tags
                      : [place.subcategory || 'Khám phá']
                  }
                  address={place.address}
                  onAddToTrip={() => handleOpenAddToTrip(place)}
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
          const matched = currentPlaces.find((p) => String(p.placeId) === String(detail.id));
          if (matched) {
            handleOpenAddToTrip(matched);
          } else {
            handleOpenAddToTrip({
              placeId: Number(detail.id),
              name: detail.title,
              category: detail.category || 'attraction',
              subcategory: detail.subcategory ?? null,
              address: detail.address || 'Việt Nam',
              rating: detail.rating ?? null,
              reviewCount: detail.reviewCount ?? null,
              photoUrl: detail.imageUrl || getPlaceFallbackImage(detail.category),
              latitude: detail.latitude ?? null,
              longitude: detail.longitude ?? null,
              description: detail.description ?? null,
            });
          }
        }}
      />

      {/* 5. Modal Thêm vào chuyến đi (kết nối API thật) */}
      <AddToTripModal
        isOpen={isAddToTripOpen}
        onClose={() => {
          setIsAddToTripOpen(false);
          setActivePlace(null);
        }}
        locationTitle={activePlace?.name}
        tripObjects={myTrips}
        isSubmitting={addItineraryItemMutation.isPending}
        onSaveTripDay={handleSaveToItinerary}
      />
    </div>
  );
}
