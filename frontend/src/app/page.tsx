'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarRange,
  CheckSquare,
  Compass,
  LogIn,
  MapPin,
  Route,
  Users,
  Wallet,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/useAuthStore';

const emptySubscribe = () => () => {};

const FEATURED_DESTINATIONS = [
  {
    provinceCode: '68',
    name: 'Lâm Đồng',
    subtitle: 'Đà Lạt • Bảo Lộc • Cao nguyên',
    poiLabel: '2.970 địa điểm',
    imageUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    provinceCode: '48',
    name: 'Đà Nẵng',
    subtitle: 'Bán đảo Sơn Trà • Bà Nà • Biển Mỹ Khê',
    poiLabel: '4.258 địa điểm',
    imageUrl:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
  },
  {
    provinceCode: '91',
    name: 'An Giang',
    subtitle: 'Phú Quốc • Châu Đốc • Rừng Tràm',
    poiLabel: '1.468 địa điểm',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    provinceCode: '01',
    name: 'Hà Nội',
    subtitle: 'Phố Cổ • Hồ Gươm • Ẩm thực di sản',
    poiLabel: '4.631 địa điểm',
    imageUrl:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=800&q=80',
  },
  {
    provinceCode: '79',
    name: 'Hồ Chí Minh',
    subtitle: 'Kiến trúc Đông Dương • Quán xá sầm uất',
    poiLabel: '6.877 địa điểm',
    imageUrl:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
  },
  {
    provinceCode: '37',
    name: 'Ninh Bình',
    subtitle: 'Tràng An • Tam Cốc • Hang Múa',
    poiLabel: 'Di sản thiên nhiên',
    imageUrl:
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  },
];

const WORKSPACE_MODULES = [
  {
    icon: Route,
    title: 'Lịch trình & Bản đồ',
    description:
      'Kéo thả sắp xếp điểm tham quan theo từng ngày, trực quan hóa tuyến đường và tự động tối ưu lộ trình ngắn nhất.',
  },
  {
    icon: Wallet,
    title: 'Quản lý chi phí',
    description:
      'Theo dõi tổng ngân sách dự kiến, tiến độ chi tiêu theo từng danh mục Ăn uống, Di chuyển, Vé tham quan và Lưu trú.',
  },
  {
    icon: CheckSquare,
    title: 'Checklist hành lý',
    description:
      'Kiểm soát tiến độ chuẩn bị đồ dùng cá nhân và giấy tờ cần thiết trước giờ khởi hành ngay trong chuyến đi.',
  },
  {
    icon: Users,
    title: 'Cộng tác bạn bè',
    description:
      'Chia sẻ liên kết mời thành viên tham gia cùng chỉnh sửa lịch trình, bình chọn điểm đến và theo dõi hành trình.',
  },
];

const PLATFORM_METRICS = [
  { value: '34', label: 'Tỉnh & Thành phố Việt Nam' },
  { value: '35.516', label: 'Điểm tham quan, nhà hàng, lưu trú' },
  { value: '2-Opt', label: 'Thuật toán tối ưu thứ tự di chuyển' },
  { value: '4 trong 1', label: 'Lịch trình • Chi phí • Hành lý • Nhóm' },
];

export default function Home() {
  const { user, isAuthenticated, hydrateAuth } = useAuthStore();

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  const loggedIn = isHydrated && isAuthenticated;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]"
    >
      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 sm:px-10 py-12 sm:py-16 space-y-16">
        {/* 1. Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            {loggedIn && user?.username ? (
              <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-[#0F766E]">
                <Compass className="w-3.5 h-3.5" />
                <span>Xin chào, {user.username} — Sẵn sàng cho hành trình tiếp theo</span>
              </p>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600">
                <Compass className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Nền tảng lập kế hoạch du lịch đồng bộ cho người Việt</span>
              </p>
            )}

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]">
              Lên kế hoạch chuyến đi, khám phá trọn vẹn từng điểm đến
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#64748B] max-w-2xl">
              Tìm kiếm địa điểm thực tế khắp 34 tỉnh thành, sắp xếp lịch trình kéo thả trực tiếp trên bản đồ, tối ưu quãng đường di chuyển và quản lý ngân sách trong một không gian thống nhất.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                href="/explore"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-6 text-sm font-bold text-white shadow-sm transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Khám phá điểm đến</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {loggedIn ? (
                <Link
                  href="/my-trips"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 text-sm font-bold text-[#0F172A] transition-colors"
                >
                  <CalendarRange className="w-4 h-4 text-[#0F766E]" />
                  <span>Chuyến đi của tôi</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 text-sm font-bold text-[#0F172A] transition-colors"
                >
                  <LogIn className="w-4 h-4 text-[#0F766E]" />
                  <span>Đăng nhập tài khoản</span>
                </Link>
              )}
            </div>
          </div>

          {/* Hình ảnh trực quan bên phải */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3.5">
              <Link
                href="/explore?destinationId=37&province=Ninh%20B%C3%ACnh"
                className="relative h-64 rounded-[22px] overflow-hidden border border-[#E2E8F0] bg-white group"
              >
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"
                  alt="Danh thắng Tràng An - Ninh Bình"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/15 to-transparent" />
                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-200">
                    <MapPin className="w-3 h-3" />
                    Ninh Bình
                  </span>
                  <p className="text-sm font-extrabold leading-snug mt-0.5">
                    Di sản Tràng An
                  </p>
                </div>
              </Link>

              <div className="flex flex-col gap-3.5">
                <Link
                  href="/explore?destinationId=68&province=L%C3%A2m%20%C4%90%E1%BB%93ng"
                  className="relative h-[121px] rounded-[20px] overflow-hidden border border-[#E2E8F0] bg-white group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                    alt="Cao nguyên Lâm Đồng"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent" />
                  <p className="absolute bottom-2.5 left-3 text-xs font-extrabold text-white">
                    Lâm Đồng • Đà Lạt
                  </p>
                </Link>

                <Link
                  href="/explore?destinationId=48&province=%C4%90%C3%A0%20N%E1%BA%B5ng"
                  className="relative h-[121px] rounded-[20px] overflow-hidden border border-[#E2E8F0] bg-white group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80"
                    alt="Thành phố Đà Nẵng"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent" />
                  <p className="absolute bottom-2.5 left-3 text-xs font-extrabold text-white">
                    Đà Nẵng • Biển & Cầu Vàng
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Dải số liệu thực của nền tảng */}
        <section className="rounded-[22px] border border-[#E2E8F0] bg-white px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {PLATFORM_METRICS.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0F766E] tabular-nums tracking-tight">
                {metric.value}
              </p>
              <p className="text-xs font-semibold text-[#64748B]">{metric.label}</p>
            </div>
          ))}
        </section>

        {/* 3. Điểm đến nổi bật */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Điểm đến nổi bật
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Chọn nhanh một tỉnh thành để duyệt hàng nghìn địa điểm đã xếp hạng sẵn sàng đưa vào lịch trình.
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:text-[#14B8A6] transition-colors"
            >
              <span>Xem tất cả 34 tỉnh thành</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_DESTINATIONS.map((dest) => (
              <Link
                key={dest.provinceCode}
                href={`/explore?destinationId=${dest.provinceCode}&province=${encodeURIComponent(dest.name)}`}
                className="group relative h-[200px] rounded-[22px] overflow-hidden border border-[#E2E8F0] bg-white"
              >
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0.08) 25%, rgba(15,23,42,0.82) 100%)',
                  }}
                />
                <div className="absolute top-3.5 left-3.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0F766E] tabular-nums">
                  {dest.poiLabel}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-extrabold tracking-tight">{dest.name}</h3>
                  <p className="text-xs text-slate-200 mt-0.5 truncate">{dest.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Tính năng đồng bộ theo 4 tab Workspace */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Đầy đủ công cụ trong một không gian làm việc
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Mọi thông tin chuyến đi của bạn luôn được sắp xếp khoa học và đồng bộ theo từng tab.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKSPACE_MODULES.map((mod) => {
              const IconComponent = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="rounded-[22px] border border-[#E2E8F0] bg-white p-6 flex flex-col gap-3.5"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
