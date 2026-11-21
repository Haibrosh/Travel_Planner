'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, NavTabType } from '@/components/layout/Navbar';
import { ExploreCategoryFilter, CategoryType } from '@/components/explore/ExploreCategoryFilter';
import { ExploreFilterBar } from '@/components/explore/ExploreFilterBar';
import { ExploreCard } from '@/components/cards/ExploreCard';
import { ExplorePagination } from '@/components/explore/ExplorePagination';
import { AddToTripModal, type AddToTripSelection } from '@/components/modals/AddToTripModal';
import { ExploreDetailModal } from '@/components/modals/ExploreDetailModal';
import { type PlaceDetailData } from '@/components/modals/PlaceDetailModal';
import { EXPLORE_PLACES_MOCK, PROVINCES_LIST, type PlaceItem } from '@/mocks/exploreData';
import { useMyTrips } from '@/hooks/useTrips';
import { useAddItineraryItemMutation } from '@/hooks/useItinerary';
import { getPlaceFallbackImage } from '@/services/explore.service';
import type { Place } from '@/types/explore';

export default function ExplorePage() {
  const router = useRouter();

  const [currentNavTab, setCurrentNavTab] = useState<NavTabType>('explore');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [rawSearchQuery, setRawSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const [visitedIds, setVisitedIds] = useState<Record<string, boolean>>({});
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [isAddToTripOpen, setIsAddToTripOpen] = useState<boolean>(false);
  const [activePlace, setActivePlace] = useState<Place | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(rawSearchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [rawSearchQuery]);

  const provincesList = useMemo(() => PROVINCES_LIST, []);

  // Lọc danh sách địa điểm (nếu dự án của bạn có hook/API riêng cho places, thay phần lọc này bằng hook đó)
  const filteredPlaces = useMemo(() => {
    return EXPLORE_PLACES_MOCK.filter((place: PlaceItem) => {
      const matchProvince = selectedProvince
        ? place.province.toLowerCase().includes(selectedProvince.toLowerCase()) ||
          place.address.toLowerCase().includes(selectedProvince.toLowerCase())
        : true;
      const matchSearch =
        place.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchCategory =
        activeCategory === 'all' ||
        place.category === activeCategory ||
        place.tags.includes(activeCategory as string);
      return matchProvince && matchSearch && matchCategory;
    });
  }, [selectedProvince, debouncedSearchQuery, activeCategory]);

  const places: Place[] = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlaces.slice(start, start + itemsPerPage).map((item: PlaceItem) => ({
      placeId: Number(item.id),
      name: item.title,
      category: item.category,
      address: item.address,
      photoUrl: item.imageUrl,
      rating: item.rating ?? null,
      description: item.description ?? null,
      content: item.content ?? null,
    })) as Place[];
  }, [filteredPlaces, currentPage]);

  const totalElements: number = filteredPlaces.length;
  const totalPages: number = Math.max(1, Math.ceil(totalElements / itemsPerPage));

  const { data: myTrips = [] } = useMyTrips();
  const addItineraryItemMutation = useAddItineraryItemMutation();

  const handleOpenAddToTrip = (place: Place) => {
    setActivePlace(place);
    setIsAddToTripOpen(true);
  };

  const handleCloseAllModals = () => {
    setIsDetailOpen(false);
    setIsAddToTripOpen(false);
    setActivePlace(null);
  };

  const handleCardClick = (place: Place) => {
    const key = String(place.placeId);
    setSelectedPlaceDetail({
      id: place.placeId,
      title: place.name,
      category: place.category || 'Khám phá',
      address: place.address || '',
      rating: place.rating ?? null,
      description: place.description ?? null,
      imageUrl: place.photoUrl || getPlaceFallbackImage(place.category),
      content: place.content ?? null,
      isVisited: Boolean(visitedIds[key]),
    } as PlaceDetailData);
    setIsDetailOpen(true);
  };

  const handleSaveToItinerary = async (selection: AddToTripSelection) => {
    if (!activePlace) return;
    // Kiểm tra lại tên trường của AddItineraryItemVariables (ví dụ: tripId, placeId, dayNumber)
    await addItineraryItemMutation.mutateAsync({
      tripId: selection.tripId,
      placeId: activePlace.placeId,
    } as any);
    handleCloseAllModals();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      <Navbar
        activeTab={currentNavTab}
        onTabChange={(tab: NavTabType) => {
          setCurrentNavTab(tab);
          if (tab === 'trips') {
            router.push('/my-trips');
          }
        }}
        onNotificationClick={() => router.push('/my-trips')}
      />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-[32px] sm:text-[38px] font-extrabold text-[#0F172A] tracking-tight">
            Khám phá điểm du lịch
          </h1>
        </div>

        <ExploreFilterBar
          selectedProvince={selectedProvince}
          onSelectProvince={(prov: string) => {
            setSelectedProvince(prov);
            setCurrentPage(1);
          }}
          provincesList={provincesList}
          searchQuery={rawSearchQuery}
          onSearchChange={setRawSearchQuery}
        />

        <ExploreCategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={(cat: CategoryType) => {
            setActiveCategory(cat);
            setCurrentPage(1);
          }}
        />

        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 px-1 pt-4">
          <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
            Tìm thấy{' '}
            <span className="text-[#14B8A6] font-black">
              {totalElements.toLocaleString('vi-VN')}
            </span>{' '}
            địa điểm phù hợp
          </span>

          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="sort-places" className="font-bold text-slate-500">
              Sắp xếp:
            </label>
            <select
              id="sort-places"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="name">Tên A - Z</option>
            </select>
          </div>
        </div>

        {places.length > 0 ? (
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {places.map((place) => {
              const imgUrl = place.photoUrl || getPlaceFallbackImage(place.category);
              const tags = place.category ? [place.category] : ['Khám phá'];
              return (
                <ExploreCard
                  key={place.placeId}
                  id={place.placeId}
                  title={place.name}
                  imageUrl={imgUrl}
                  tags={tags}
                  address={place.address || ''}
                  onAddToTrip={() => handleOpenAddToTrip(place)}
                  onClick={() => handleCardClick(place)}
                />
              );
            })}
          </div>
        ) : (
          <div className="max-w-[1280px] mx-auto col-span-full text-center py-20 bg-white rounded-2xl border border-[#E2E8F0] text-slate-400 text-sm font-medium shadow-xs">
            Không tìm thấy địa điểm phù hợp
          </div>
        )}

        <div className="pt-6">
          <ExplorePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </main>

      <ExploreDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedPlaceDetail?.title || ''}
        imageUrl={selectedPlaceDetail?.imageUrl || ''}
        description={selectedPlaceDetail?.description}
        tags={selectedPlaceDetail?.category ? [selectedPlaceDetail.category] : []}
        address={selectedPlaceDetail?.address || ''}
        rating={selectedPlaceDetail?.rating}
        isVisited={selectedPlaceDetail?.isVisited}
        onToggleVisited={() => {
          if (!selectedPlaceDetail) return;
          const key = String(selectedPlaceDetail.id);
          setVisitedIds((prev) => ({ ...prev, [key]: !prev[key] }));
          setSelectedPlaceDetail((prev) =>
            prev ? { ...prev, isVisited: !prev.isVisited } : null
          );
        }}
        content={selectedPlaceDetail?.content || null}
        onAddToTrip={() => {
          if (!selectedPlaceDetail) return;
          handleOpenAddToTrip({
            placeId: Number(selectedPlaceDetail.id),
            name: selectedPlaceDetail.title,
            category: selectedPlaceDetail.category,
            address: selectedPlaceDetail.address || '',
            photoUrl: selectedPlaceDetail.imageUrl || null,
            rating: selectedPlaceDetail.rating ?? null,
            description: selectedPlaceDetail.description ?? null,
            content: selectedPlaceDetail.content ?? null,
          } as Place);
        }}
      />

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