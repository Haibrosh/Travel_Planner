'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useSyncExternalStore } from 'react';

interface NavbarProps {
  onOpenCreateTrip?: () => void;
}

const emptySubscribe = () => () => {};

export default function Navbar({ onOpenCreateTrip }: NavbarProps) {
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/my-trips', label: 'Chuyến đi của tôi' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/my-trips" className="flex items-center gap-2.5 font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
              ✈️
            </span>
            <span className="text-base font-semibold tracking-tight">Travel Planner</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Actions & User Info */}
        <div className="flex items-center gap-3">
          {onOpenCreateTrip && (
            <button
              onClick={onOpenCreateTrip}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + Tạo chuyến đi
            </button>
          )}

          {isHydrated && isAuthenticated ? (
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {user?.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="Đăng xuất"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
