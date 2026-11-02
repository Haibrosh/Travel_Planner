import type { Destination, Place } from '@/types/explore';

export interface PlaceItem {
  id: number;
  title: string;
  imageUrl: string;
  tags: string[];
  address: string;
  province: string;
  provinceCode?: string;
  category: string;
  subcategory?: string;
  description: string;
  rating?: number;
  reviewsCount?: number;
  price?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
}

export const DEFAULT_DESTINATIONS: Destination[] = [
  { provinceCode: '68', slug: 'lam-dong', name: 'Lâm Đồng (Đà Lạt)', fullName: 'Tỉnh Lâm Đồng', centerLat: 11.9404, centerLng: 108.4583 },
  { provinceCode: '48', slug: 'da-nang', name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng', centerLat: 16.0544, centerLng: 108.2022 },
  { provinceCode: '79', slug: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh', centerLat: 10.8231, centerLng: 106.6297 },
  { provinceCode: '01', slug: 'ha-noi', name: 'Hà Nội', fullName: 'Thành phố Hà Nội', centerLat: 21.0285, centerLng: 105.8542 },
  { provinceCode: '77', slug: 'ba-ria-vung-tau', name: 'Bà Rịa - Vũng Tàu', fullName: 'Tỉnh Bà Rịa - Vũng Tàu', centerLat: 10.346, centerLng: 107.0843 },
  { provinceCode: '56', slug: 'khanh-hoa', name: 'Khánh Hòa (Nha Trang)', fullName: 'Tỉnh Khánh Hòa', centerLat: 12.2388, centerLng: 109.1967 },
  { provinceCode: '91', slug: 'kien-giang', name: 'Kiên Giang (Phú Quốc)', fullName: 'Tỉnh Kiên Giang', centerLat: 10.2899, centerLng: 103.984 },
  { provinceCode: '49', slug: 'quang-nam', name: 'Quảng Nam (Hội An)', fullName: 'Tỉnh Quảng Nam', centerLat: 15.8801, centerLng: 108.338 },
  { provinceCode: '10', slug: 'lao-cai', name: 'Lào Cai (Sapa)', fullName: 'Tỉnh Lào Cai', centerLat: 22.3364, centerLng: 103.8438 },
  { provinceCode: '92', slug: 'can-tho', name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ', centerLat: 10.0452, centerLng: 105.7469 },
];

export const EXPLORE_PLACES_MOCK: PlaceItem[] = [
  {
    id: 1,
    title: 'Quảng trường Lâm Viên',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Chụp ảnh'],
    address: 'Đ. Trần Quốc Toản, Xuân Hương - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Lâm Đồng (Đà Lạt)',
    provinceCode: '68',
    category: 'sightseeing',
    subcategory: 'Quảng trường & Công viên',
    description: 'Biểu tượng du lịch nổi tiếng của thành phố sương mù với khối nụ hoa Atiso và hoa Dã Quỳ khổng lồ bên hồ Xuân Hương.',
    rating: 4.8,
    reviewsCount: 1240,
    price: 'Miễn phí',
    phone: '0263 3822 345',
    website: 'https://dalat.lamdong.gov.vn',
    openingHours: 'Mở cửa cả ngày (00:00 – 23:59)',
    latitude: 11.9412,
    longitude: 108.4426,
  },
  {
    id: 2,
    title: 'Tiệm Cà Phê Túi Mơ To',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Cà phê', 'Chụp ảnh'],
    address: 'Hẻm 31 Sào Nam, Phường 11, Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Lâm Đồng (Đà Lạt)',
    provinceCode: '68',
    category: 'cafe',
    subcategory: 'Quán cà phê sân vườn',
    description: 'Không gian cà phê nhà kính mộc mạc ngập tràn cúc họa mi và tầm nhìn toàn cảnh đồi thông cùng nhà lồng buổi tối.',
    rating: 4.7,
    reviewsCount: 950,
    price: '45.000 – 75.000 đ',
    phone: '0938 622 234',
    website: 'https://facebook.com/tiemcaphetuimoto',
    openingHours: '07:45 – 21:45',
    latitude: 11.9345,
    longitude: 108.4812,
  },
  {
    id: 3,
    title: 'Vườn hoa Thành phố Đà Lạt',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Chụp ảnh'],
    address: '02 Đ. Trần Nhân Tông, Phường 8, Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Lâm Đồng (Đà Lạt)',
    provinceCode: '68',
    category: 'photo',
    subcategory: 'Vườn thực vật',
    description: 'Nơi quy tụ hơn 300 giống hoa đặc trưng của cao nguyên Lâm Viên khoe sắc quanh năm.',
    rating: 4.5,
    reviewsCount: 850,
    price: '100.000 đ',
    phone: '0263 3822 151',
    website: 'https://dalatflowerpark.vn',
    openingHours: '07:30 – 17:00',
    latitude: 11.9499,
    longitude: 108.4494,
  },
  {
    id: 4,
    title: 'Lẩu gà lá é Tao Ngộ',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực'],
    address: '05 Đường 3/4, Phường 3, Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Lâm Đồng (Đà Lạt)',
    provinceCode: '68',
    category: 'food',
    subcategory: 'Nhà hàng đặc sản',
    description: 'Món lẩu gà lá é nóng hổi thơm the mát kèm măng tươi và nấm bào ngư chuẩn vị phố núi.',
    rating: 4.6,
    reviewsCount: 1120,
    price: '200.000 – 350.000 đ',
    phone: '0977 144 233',
    openingHours: '08:00 – 22:00',
    latitude: 11.9301,
    longitude: 108.4451,
  },
  {
    id: 5,
    title: 'Bà Nà Hills Sun World',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Vui chơi'],
    address: 'Thôn An Sơn, Xã Hòa Ninh, Huyện Hòa Vang, Đà Nẵng, Việt Nam',
    province: 'Đà Nẵng',
    provinceCode: '48',
    category: 'entertainment',
    subcategory: 'Tổ hợp giải trí & Cầu Vàng',
    description: 'Quần thể du lịch nghỉ dưỡng kết hợp vui chơi giải trí trên đỉnh núi Chúa với Cầu Vàng nổi tiếng thế giới.',
    rating: 4.9,
    reviewsCount: 3400,
    price: '900.000 đ',
    phone: '0905 766 777',
    website: 'https://banahills.sunworld.vn',
    openingHours: '07:00 – 22:00',
    latitude: 15.9977,
    longitude: 107.9881,
  },
  {
    id: 6,
    title: 'Phố cổ Hội An',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Chụp ảnh'],
    address: 'Phường Minh An, Hội An, Quảng Nam, Việt Nam',
    province: 'Quảng Nam (Hội An)',
    provinceCode: '49',
    category: 'sightseeing',
    subcategory: 'Di sản văn hóa UNESCO',
    description: 'Di sản văn hóa thế giới với những dãy nhà cổ tường vàng, chùa Cầu và phố đèn lồng lung linh bên sông Hoài.',
    rating: 4.9,
    reviewsCount: 4100,
    price: 'Miễn phí – 80.000 đ',
    phone: '0235 3861 327',
    website: 'https://hoianworldheritage.org.vn',
    openingHours: '07:00 – 22:30',
    latitude: 15.8794,
    longitude: 108.335,
  },
  {
    id: 7,
    title: 'The Little Bean Homestay & Cafe',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    tags: ['Homestay', 'Cà phê'],
    address: '71 Trần Phú, Phường 5, TP. Vũng Tàu, Bà Rịa - Vũng Tàu, Việt Nam',
    province: 'Bà Rịa - Vũng Tàu',
    provinceCode: '77',
    category: 'homestay',
    subcategory: 'Homestay view biển',
    description: 'Homestay kết hợp quán cà phê hướng biển Bãi Trước với thiết kế Địa Trung Hải thoáng đãng.',
    rating: 4.7,
    reviewsCount: 420,
    price: '450.000 đ / đêm',
    phone: '0908 512 889',
    openingHours: 'Nhận phòng 14:00 – Trả phòng 12:00',
    latitude: 10.3592,
    longitude: 107.0681,
  },
  {
    id: 8,
    title: 'Bến Bạch Đằng & Waterbus Sài Gòn',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Vui chơi', 'Chụp ảnh'],
    address: 'Số 10B Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    province: 'TP. Hồ Chí Minh',
    provinceCode: '79',
    category: 'sightseeing',
    subcategory: 'Bến du thuyền & Công viên ven sông',
    description: 'Điểm dạo mát, ngắm hoàng hôn trên sông Sài Gòn bằng buýt đường sông và chiêm ngưỡng cầu Ba Son rực rỡ về đêm.',
    rating: 4.8,
    reviewsCount: 2150,
    price: '15.000 đ / lượt',
    phone: '1900 636 830',
    website: 'https://saigonwaterbus.com',
    openingHours: '07:00 – 22:00',
    latitude: 10.7745,
    longitude: 106.7068,
  },
];

export function mapMockItemToPlace(item: PlaceItem): Place {
  return {
    placeId: item.id,
    name: item.title,
    category: item.category,
    subcategory: item.subcategory || item.tags[0] || 'Khám phá',
    address: item.address,
    phone: item.phone || null,
    website: item.website || null,
    openingHours: item.openingHours || null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    provinceCode: item.provinceCode,
    destinationName: item.province,
    rating: item.rating ?? 4.7,
    reviewCount: item.reviewsCount ?? 100,
    photoUrl: item.imageUrl,
    description: item.description,
    price: item.price || null,
    tags: item.tags,
  };
}

export const PROVINCES_LIST = [
  'Tất cả tỉnh thành',
  ...DEFAULT_DESTINATIONS.map((d) => d.name),
];

export const EXPLORE_CATEGORIES = ['Tất cả', 'Cà phê', 'Ẩm thực', 'Chụp ảnh', 'Homestay', 'Tham quan', 'Vui chơi'];
