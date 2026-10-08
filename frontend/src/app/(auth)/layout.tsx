import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | Travel Planner',
  description: 'Đăng nhập vào tài khoản Travel Planner của bạn',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
