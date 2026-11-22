import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài khoản | TravelSync',
  description: 'Đăng nhập hoặc đăng ký tài khoản TravelSync để lên kế hoạch chuyến đi',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-10"
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
