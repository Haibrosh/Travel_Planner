'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Compass, LogOut, Plus, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export type NavTabType = 'trips' | 'explore';

export interface NavbarProps {
  activeTab?: NavTabType;
  onTabChange?: (tab: NavTabType) => void;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  onLogoClick?: () => void;
  onOpenCreateTrip?: () => void;
}

const emptySubscribe = () => () => {};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onNotificationClick,
  onUserClick,
  onLogoClick,
  onOpenCreateTrip,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, hydrateAuth } = useAuthStore();

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  const resolvedActiveTab: NavTabType | undefined =
    activeTab ??
    (pathname?.startsWith('/my-trips') || pathname?.startsWith('/trips')
      ? 'trips'
      : pathname?.startsWith('/explore')
        ? 'explore'
        : undefined);

  const userName = user?.username || 'User';
  const userAvatarBg = '#0D9488';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleSelectTab = (tab: NavTabType) => {
    if (onTabChange) {
      onTabChange(tab);
      if (tab === 'trips' && !pathname?.startsWith('/my-trips')) {
        router.push('/my-trips');
      } else if (tab === 'explore' && !pathname?.startsWith('/explore')) {
        router.push('/explore');
      }
      return;
    }
    router.push(tab === 'trips' ? '/my-trips' : '/explore');
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      router.push('/');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-50 select-none"
    >
      <div className="relative w-full max-w-[1440px] h-[76px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-3">
        {/* Cụm 1: Logo & Tên TravelSync */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer z-10 text-left group"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#14B8A6] group-hover:bg-[#0D9488] transition-colors flex items-center justify-center shadow-xs shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M3.5 10.5L16.5 4.5L10.5 16.5L9.2 11.8L3.5 10.5Z"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[20px] font-extrabold tracking-tight text-[#0F172A]">
            TravelSync
          </span>
        </button>

        {/* Cụm 2: Navigation Switcher (Desktop) */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center w-[310px] lg:w-[330px] h-[48px] p-1.5 bg-[#64748B]/[0.06] border border-slate-200 rounded-[14px]"
        >
          <button
            type="button"
            onClick={() => handleSelectTab('trips')}
            style={
              resolvedActiveTab === 'trips'
                ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' }
                : undefined
            }
            className={`flex-1 h-[36px] rounded-[11px] flex items-center justify-center gap-2 text-[14px] tracking-normal transition-all cursor-pointer ${
              resolvedActiveTab === 'trips'
                ? 'bg-white text-[#0F172A] font-bold'
                : 'text-[#64748B] font-semibold hover:text-[#0F172A]'
            }`}
          >
            <Ticket className="w-4 h-4 stroke-[2.2]" />
            <span>Chuyến đi</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('explore')}
            style={
              resolvedActiveTab === 'explore'
                ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' }
                : undefined
            }
            className={`flex-1 h-[36px] rounded-[11px] flex items-center justify-center gap-2 text-[14px] tracking-normal transition-all cursor-pointer ${
              resolvedActiveTab === 'explore'
                ? 'bg-white text-[#0F172A] font-bold'
                : 'text-[#64748B] font-semibold hover:text-[#0F172A]'
            }`}
          >
            <Compass className="w-4 h-4 stroke-[2.2]" />
            <span>Khám phá</span>
          </button>
        </nav>

        {/* Cụm 3: Hành động + Chuông thông báo + Profile / Auth */}
        <div className="flex items-center gap-2 sm:gap-3.5 z-10">
          {onOpenCreateTrip && (
            <button
              type="button"
              onClick={onOpenCreateTrip}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo chuyến đi</span>
            </button>
          )}

          {isHydrated && isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onNotificationClick ? onNotificationClick() : router.push('/my-trips')
                }
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Chuyến đi & thông báo"
                aria-label="Thông báo"
              >
                <Bell className="w-[20px] h-[20px] stroke-[2.1]" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onUserClick ? onUserClick() : router.push('/my-trips')
                }
                className="flex items-center gap-2.5 cursor-pointer rounded-full pr-1 hover:opacity-90 transition-opacity"
                title="Đi tới Chuyến đi của tôi"
              >
                <div
                  style={{ backgroundColor: userAvatarBg }}
                  className="w-[38px] h-[38px] rounded-full border-2 border-white flex items-center justify-center text-[14px] font-extrabold text-white shadow-xs"
                >
                  {userInitial}
                </div>
                <span className="text-[14px] font-bold text-[#0F172A] hidden sm:inline-block max-w-[140px] truncate">
                  {userName}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex h-9 items-center justify-center rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-3.5 text-xs font-bold text-white shadow-xs transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Thanh chuyển nhanh trên Mobile (< md) */}
      <div className="flex md:hidden border-t border-slate-200/80 bg-[#F8FAFC] px-4 py-1.5 gap-2">
        <button
          type="button"
          onClick={() => handleSelectTab('trips')}
          className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
            resolvedActiveTab === 'trips'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-[#64748B]'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Chuyến đi</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('explore')}
          className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
            resolvedActiveTab === 'explore'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-[#64748B]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Khám phá</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
