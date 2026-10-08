'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import type { LoginRequest } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">✈️ Travel Planner</h1>
        <p className="mt-2 text-gray-500">Chào mừng bạn quay trở lại!</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900
                       placeholder-gray-400 outline-none transition
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900
                       placeholder-gray-400 outline-none transition
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                     transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <hr className="flex-1 border-gray-200" />
        <span className="text-xs text-gray-400">HOẶC</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      {/* Switch to Register */}
      <p className="text-center text-sm text-gray-500">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
