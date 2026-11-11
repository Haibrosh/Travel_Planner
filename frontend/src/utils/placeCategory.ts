const CATEGORY_LABELS: Record<string, string> = {
  // 4 mã category chuẩn của places_v2
  attraction: 'Điểm tham quan',
  restaurant: 'Nhà hàng',
  cafe: 'Quán cà phê',
  hotel: 'Khách sạn & Lưu trú',
  // Tương thích ngược các mã cũ / subcategory
  beach: 'Bãi biển',
  landmark: 'Điểm tham quan',
  viewpoint: 'Điểm ngắm cảnh',
  food: 'Ẩm thực',
  sightseeing: 'Tham quan',
  entertainment: 'Vui chơi',
  homestay: 'Homestay',
  photo: 'Chụp ảnh',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
