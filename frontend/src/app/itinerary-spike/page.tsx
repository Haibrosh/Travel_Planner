import ItineraryPrototype from '@/components/itinerary/ItineraryPrototype';
import ItineraryMap from '@/components/itinerary/ItineraryMap';

// Trip để chạy thử. Chạy với backend thật thì đổi thành chuyến đi có thật của tài khoản đang đăng nhập
const MOCK_TRIP = { tripId: 1, startDate: '2026-11-14', endDate: '2026-11-16', provinceCode: '77' };

export default function ItinerarySpikePage() {
  return (
    <main className="flex h-screen bg-slate-50">
      <div className="w-[460px] shrink-0 border-r border-slate-200 bg-white">
        <ItineraryPrototype trip={MOCK_TRIP} />
      </div>
      <div className="relative z-0 h-full flex-1">
        <ItineraryMap trip={MOCK_TRIP} />
      </div>
    </main>
  );
}