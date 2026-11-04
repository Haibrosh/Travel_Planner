import type { Place } from '@/types/place';
import type { ItineraryItem } from '@/types/itinerary';

interface VisitMeta {
  tags: string[];
  note?: string;
  imageUrl?: string; // Đường dẫn ảnh(không có sẽ ko hiện ảnh)
}

// Dữ liệu mẫu cố định theo id địa điểm trong places.json
const VISIT_META: Record<string, VisitMeta> = {
  '1': { tags: ['Tắm biển', 'Thư giãn'], note: 'Đến sớm để tránh nắng gắt' },
  '2': { tags: ['Dạo biển', 'Ăn vặt'], note: 'Dạo bộ dọc bờ biển buổi chiều' },
  '3': { tags: ['Tham quan', 'Chụp ảnh'], note: 'Leo nhiều bậc thang, nhớ mang nước' },
  '4': { tags: ['Tham quan', 'Ngắm cảnh'], note: 'Ngắm toàn cảnh thành phố từ trên cao' },
  '5': { tags: ['Tham quan', 'Chụp ảnh'], note: 'Kiểm tra giờ mở cửa trước khi đi' },
};

// Tạo mục lịch trình từ một địa điểm (sau này thay bằng dữ liệu từ API)
export function createMockItem(place: Place): ItineraryItem {
  const meta = VISIT_META[place.id];
  return {
    place,
    tags: meta?.tags ?? [],
    note: meta?.note,
    imageUrl: meta?.imageUrl,
  };
}