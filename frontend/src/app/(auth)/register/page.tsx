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
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">✈️ Travel Planner</h1>
        <p className="mt-2 text-gray-500">Tạo tài khoản mới</p>
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
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900
                       placeholder-gray-400 outline-none transition
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

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
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ít nhất 6 ký tự"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900
                       placeholder-gray-400 outline-none transition
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900
                       placeholder-gray-400 outline-none transition
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                     transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
