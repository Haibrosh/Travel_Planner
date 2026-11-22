'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import type { RegisterRequest } from '@/types/auth';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = (): boolean => {
    if (formData.password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      // Đăng ký xong → chuyển sang trang login
      router.push('/login?registered=true');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(
        apiErr?.response?.data?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[22px] border border-[#E2E8F0] shadow-sm p-8">
      {/* Header với Logo TravelSync */}
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
          Tạo tài khoản mới
        </h1>
        <p className="mt-1 text-xs text-[#64748B]">
          Đồng bộ lịch trình, bản đồ và chi phí chuyến đi cùng bạn bè
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Tên hiển thị (Username)
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="nguyenvana"
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A]
                       placeholder:text-slate-400 outline-none transition
                       focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

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
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ít nhất 6 ký tự"
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A]
                       placeholder:text-slate-400 outline-none transition
                       focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
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
          {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="mt-6 text-center text-xs text-[#64748B]">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-bold text-[#0F766E] hover:text-[#14B8A6]">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
