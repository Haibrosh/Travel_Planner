import Link from "next/link";
import Navbar from "@/components/common/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-20 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 mb-6">
            <span>✨</span>
            <span>Ứng dụng lập kế hoạch du lịch cho người Việt</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            Lên kế hoạch chuyến đi, <br className="hidden sm:inline" />
            khám phá trọn vẹn từng điểm đến
          </h1>

          <p className="mt-6 text-base leading-7 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Tất cả trong một nền tảng: sắp xếp lịch trình trên bản đồ, quản lý chi phí, kiểm tra hành lý và cùng bạn bè lên kế hoạch chuyến đi nhanh chóng.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/my-trips"
              className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Xem chuyến đi của tôi →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Đăng nhập tài khoản
            </Link>
          </div>
        </div>

        {/* Feature Highlights matching the 4 workspace tabs */}
        <div className="mt-24 mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl mb-3 block">📅</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Lịch trình & Bản đồ</h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Tổ chức các điểm tham quan theo ngày, trực quan hóa toàn bộ lộ trình trên bản đồ Leaflet.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl mb-3 block">💰</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Quản lý chi phí</h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Theo dõi ngân sách, ghi chú các khoản đã chi tiêu và phân chia công bằng cho từng người.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl mb-3 block">🧳</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Checklist hành lý</h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Danh sách đồ dùng phân loại khoa học giúp bạn không bao giờ quên đồ trước khi khởi hành.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl mb-3 block">👥</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Cộng tác bạn bè</h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Gửi link mời để cùng bạn bè đóng góp ý kiến, biểu quyết và cập nhật chuyến đi trực tiếp.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
