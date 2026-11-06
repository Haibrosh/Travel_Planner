'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, NavTabType } from '@/components/layout/Navbar';
import { ExploreCategoryFilter, CategoryType } from '@/components/explore/ExploreCategoryFilter';
import { ExploreFilterBar } from '@/components/explore/ExploreFilterBar';
import { ExploreCard } from '@/components/cards/ExploreCard';
import { ExplorePagination } from '@/components/explore/ExplorePagination';
import { AddToTripModal } from '@/components/modals/AddToTripModal';
import { ExploreDetailModal } from '@/components/modals/ExploreDetailModal';
import { EXPLORE_PLACES_MOCK, PROVINCES_LIST, PlaceItem } from '@/mocks/exploreData';

export default function ExplorePage() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentNavTab, setCurrentNavTab] = useState<NavTabType>('explore');

  // State bộ lọc
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [rawSearchQuery, setRawSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryType | string>('all');

  // State phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;

  // State quản lý Modal Chi tiết địa điểm (Sử dụng ExploreDetailModal chuẩn to ở giữa)
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // State quản lý Modal Thêm vào chuyến đi
  const [isAddToTripOpen, setIsAddToTripOpen] = useState<boolean>(false);
  const [activePlaceForTrip, setActivePlaceForTrip] = useState<PlaceItem | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce 300ms cho tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(rawSearchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [rawSearchQuery]);

  if (!isMounted) return null;

  // Lọc danh sách địa điểm
  const filteredPlaces = EXPLORE_PLACES_MOCK.filter((place: PlaceItem) => {
    const matchProvince = selectedProvince
      ? place.province.toLowerCase().includes(selectedProvince.toLowerCase()) || place.address.toLowerCase().includes(selectedProvince.toLowerCase())
      : true;
    const matchSearch =
      place.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchCategory = activeCategory === 'all' || place.category === activeCategory || place.tags.includes(activeCategory as string);
    return matchProvince && matchSearch && matchCategory;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlaces = filteredPlaces.slice(startIndex, startIndex + itemsPerPage);

  // Mở modal Thêm vào chuyến đi
  const handleOpenAddToTrip = (place: PlaceItem) => {
    setActivePlaceForTrip(place);
    setIsAddToTripOpen(true);
  };

  // Mở modal Chi tiết địa điểm (Dùng ExploreDetailModal)
  const handleCardClick = (place: PlaceItem) => {
    setSelectedPlaceDetail(place);
    setIsDetailOpen(true);
  };

  const handleCloseAllModals = () => {
    setIsDetailOpen(false);
    setSelectedPlaceDetail(null);
    setIsAddToTripOpen(false);
    setActivePlaceForTrip(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* 1. Navbar */}
      <Navbar
        activeTab={currentNavTab}
        onTabChange={(tab: NavTabType) => {
          setCurrentNavTab(tab);
          if (tab === 'trips') {
            window.location.href = '/my-trips';
          }
        }}
        onNotificationClick={() => alert('Mở thông báo')}
        onUserClick={() => alert('Mở trang cá nhân')}
        onLogoClick={() => window.location.href = '/explore'}
      />

      {/* 2. Container chính */}
      <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 pt-10 pb-16 space-y-6">
        {/* Tiêu đề trang */}
        <div className="text-center space-y-2">
          <h1 className="text-[32px] sm:text-[38px] font-extrabold text-[#0F172A] tracking-tight">
            Khám phá điểm du lịch
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
            provincesList={PROVINCES_LIST}
          />
        </div>

        {/* Thanh chip phân loại danh mục */}
        <div className="max-w-[900px] mx-auto pt-2">
          <ExploreCategoryFilter
            activeCategory={activeCategory as CategoryType}
            onSelectCategory={(catId: CategoryType) => {
              setActiveCategory(catId);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Thống kê kết quả */}
        <div className="max-w-[1280px] mx-auto flex items-center justify-between px-1 pt-4">
          <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
            Tìm thấy <span className="text-[#14B8A6] font-black">{filteredPlaces.length}</span> địa điểm
          </span>
        </div>

        {/* Lưới thẻ khám phá */}
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {currentPlaces.length > 0 ? (
            currentPlaces.map((place: PlaceItem) => (
              <ExploreCard
                key={place.id}
                id={place.id}
                title={place.title}
                imageUrl={place.imageUrl}
                tags={place.tags}
                address={place.address}
                onAddToTrip={() => handleOpenAddToTrip(place)}
                onClick={() => handleCardClick(place)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-[#E2E8F0] text-slate-400 text-sm font-medium shadow-xs">
              Không tìm thấy địa điểm phù hợp
            </div>
          )}
        </div>

        {/* 3. Thanh phân trang */}
        <div className="pt-6">
          <ExplorePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </main>

      {/* 4. Modal Chi tiết địa điểm chuẩn giữa màn hình (ExploreDetailModal) */}
      <ExploreDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedPlaceDetail?.title || ''}
        imageUrl={selectedPlaceDetail?.imageUrl || ''}
        description={selectedPlaceDetail?.description || ''}
        tags={selectedPlaceDetail?.tags || []}
        address={selectedPlaceDetail?.address || ''}
        content={selectedPlaceDetail?.content || null}
        onAddToTrip={() => {
          if (selectedPlaceDetail) {
            handleOpenAddToTrip(selectedPlaceDetail);
          }
        }}
      />

      {/* 5. Modal Thêm vào chuyến đi */}
      <AddToTripModal
        isOpen={isAddToTripOpen}
        onClose={() => {
          setIsAddToTripOpen(false);
          setActivePlaceForTrip(null);
        }}
        locationTitle={activePlaceForTrip?.title}
        onSave={(trip: string, date: string) => {
          alert(`Thêm "${activePlaceForTrip?.title}" vào chuyến đi "${trip}" (Ngày ${date}) thành công!`);
          handleCloseAllModals();
        }}
      />
    </div>
  );
}