'use client';

import React from 'react';
import { Bell } from 'lucide-react';

export type NavTabType = 'trips' | 'explore';

export interface NavbarProps {
  activeTab?: NavTabType;
  onTabChange?: (tab: NavTabType) => void;
  user?: {
    name: string;
    avatarInitial?: string;
    avatarBg?: string;
  };
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  onLogoClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'trips',
  onTabChange,
  user = {
    name: 'User',
    avatarInitial: 'U',
    avatarBg: '#0D9488',
  },
  onNotificationClick,
  onUserClick,
  onLogoClick,
}) => {
  return (
    <header
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-50 select-none"
    >
      {/* Giữ nguyên khung tỉ lệ 1440px theo ý bạn */}
      <div className="relative w-full max-w-[1440px] h-[76px] mx-auto px-6 sm:px-12 flex items-center justify-between">
        
        {/* Cụm 1: Logo & Tên TravelSync */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-3.5 cursor-pointer group z-10"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#14B8A6] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
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
        </div>

        {/* Cụm 2: Navigation Switcher - Ép font chuẩn xác */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center w-[330px] h-[50px] p-1.5 bg-[#64748B]/[0.06] border border-slate-200 rounded-[14px]">
          {/* Tab: Chuyến đi */}
          <button
            type="button"
            onClick={() => onTabChange?.('trips')}
            style={
              activeTab === 'trips'
                ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' }
                : undefined
            }
            className={`flex-1 h-[38px] rounded-[11px] flex items-center justify-center gap-2.5 text-[14px] font-bold tracking-normal transition-all cursor-pointer ${
              activeTab === 'trips'
                ? 'bg-white text-[#0F172A]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
            <span>Chuyến đi</span>
          </button>

          {/* Tab: Khám phá */}
          <button
            type="button"
            onClick={() => onTabChange?.('explore')}
            style={
              activeTab === 'explore'
                ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' }
                : undefined
            }
            className={`flex-1 h-[38px] rounded-[11px] flex items-center justify-center gap-2.5 text-[14px] font-semibold tracking-normal transition-all cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-white text-[#0F172A]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span>Khám phá</span>
          </button>
        </div>

        {/* Cụm 3: Chuông thông báo & Profile */}
        <div className="flex items-center gap-4 sm:gap-6 z-10">
          <button
            type="button"
            onClick={onNotificationClick}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-[21px] h-[21px] stroke-[2.2]" />
          </button>

          <div
            onClick={onUserClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              style={{ backgroundColor: user.avatarBg || '#0D9488' }}
              className="w-[40px] h-[40px] rounded-full border-2 border-white flex items-center justify-center text-[15px] font-extrabold text-white shadow-xs group-hover:scale-105 transition-transform"
            >
              {user.avatarInitial || user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[15px] font-bold text-[#0F172A] hidden sm:inline-block">
              {user.name}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};