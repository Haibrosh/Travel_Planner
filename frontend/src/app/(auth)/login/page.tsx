'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import type { LoginRequest } from '@/types/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [hideRegisteredBanner, setHideRegisteredBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showRegisteredSuccess =
    searchParams.get('registered') === 'true' && !hideRegisteredBanner;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setHideRegisteredBanner(true);

    try {
      await authService.login(formData);
      router.push('/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(
        apiErr?.response?.data?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[22px] border border-[#E2E8F0] shadow-sm p-8">
      {/* Header với Logo TravelSync chuẩn */}
      <div className="text-center mb-7">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-[11px] bg-[#14B8A6] group-hover:bg-[#0D9488] transition-colors flex items-center justify-center shadow-xs">
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
          <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            TravelSync
          </span>
        </Link>
        <h1 className="mt-4 text-xl font-extrabold text-[#0F172A]">
          Đăng nhập tài khoản
        </h1>
        <p className="mt-1 text-xs text-[#64748B]">
          Chào mừng bạn quay trở lại cùng những hành trình mới
        </p>
      </div>

      {/* Registration Success Banner */}
      {showRegisteredSuccess && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-700">
          Đăng ký tài khoản thành công! Vui lòng đăng nhập.
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A]
                       placeholder:text-slate-400 outline-none transition
                       focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A]
                       placeholder:text-slate-400 outline-none transition
                       focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-4 text-sm font-bold text-white
                     transition focus:outline-none focus:ring-2 focus:ring-teal-500/30
                     disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <hr className="flex-1 border-slate-200" />
        <span className="text-[11px] font-bold text-slate-400">HOẶC</span>
        <hr className="flex-1 border-slate-200" />
      </div>

      {/* Switch to Register & Explore */}
      <div className="space-y-2.5 text-center text-xs">
        <p className="text-[#64748B]">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-bold text-[#0F766E] hover:text-[#14B8A6]">
            Đăng ký ngay
          </Link>
        </p>
        <p>
          <Link href="/explore" className="font-semibold text-slate-500 hover:text-[#0F172A]">
            Quay lại khám phá điểm đến →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
