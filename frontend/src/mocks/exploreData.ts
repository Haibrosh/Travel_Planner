export interface WikiContent {
  summary: string;
  attribution?: string;
  sourceWikiUrl?: string;
}

export interface PlaceItem {
  id: number;
  title: string;
  imageUrl: string;
  tags: string[];
  address: string;
  province: string;
  category: string;
  description: string;
  rating?: number;
  reviewsCount?: number;
  price?: string;
  content?: WikiContent | null; // Thêm trường dữ liệu Wiki từ DB
}

export const EXPLORE_PLACES_MOCK: PlaceItem[] = [
  {
    id: 1,
    title: 'Quảng trường Lâm Viên',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Check-in'],
    address: 'Đ. Trần Quốc Toản, Xuân Hương - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'sightseeing',
    description: 'Biểu tượng du lịch nổi tiếng tại thành phố ngàn hoa.',
    rating: 4.8,
    reviewsCount: 1240,
    price: 'Miễn phí',
    content: {
      summary: 'Quảng trường Lâm Viên nằm tại trung tâm thành phố Đà Lạt, hướng ra hồ Xuân Hương. Công trình nổi bật với hai kiến trúc khổng lồ bằng kính là khối hoa dã quỳ và khối nụ hoa Atiso.',
      attribution: 'Wikipedia - Bách khoa toàn thư mở',
      sourceWikiUrl: 'https://vi.wikipedia.org/wiki/Qu%E1%BA%A3ng_tr%C6%B0%E1%BB%9Dng_L%C3%A2m_Vi%C3%AAn',
    },
  },
  {
    id: 2,
    title: 'Tiệm Cà Phê Tú Mơ To',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Cà phê', 'Check-in'],
    address: 'Hẻm 31 Sào Nam, Xuân Trường - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'cafe',
    description: 'Không gian ấm cúng ngập tràn trà mi.',
    rating: 4.7,
    reviewsCount: 950,
    price: '40.000 đ',
    content: null, // Test trường hợp không có bài giới thiệu Wiki (tự động ẩn phần mô tả)
  },
  {
    id: 3,
    title: 'Vườn hoa Thành phố',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Check-in'],
    address: '02 Đ. Trần Nhân Tông, Lâm Viên - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'sightseeing',
    description: 'Nơi quy tụ hàng trăm giống hoa khoe sắc quanh năm.',
    rating: 4.5,
    reviewsCount: 850,
    price: '50.000 đ',
    content: {
      summary: 'Vườn hoa thành phố Đà Lạt là nơi trưng bày bộ sưu tập hoa lớn và phong phú nhất nước với hàng trăm giống hoa khác nhau.',
      attribution: 'Wikipedia',
      sourceWikiUrl: 'https://vi.wikipedia.org/wiki/V%C6%B0%E1%BB%9Dn_hoa_Th%C3%A0nh_ph%E1%BB%_%C4%90%C3%A0_L%E1%BA%A1t',
    },
  },
  {
    id: 4,
    title: 'Lẩu Dê Tao Ngộ',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực'],
    address: '10Bis Ba Tháng Hai, Xuân Hương - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'food',
    description: 'Món lẩu nóng hổi giữa tiết trời se lạnh.',
    rating: 4.6,
    reviewsCount: 1120,
    price: '200.000 đ',
    content: null,
  },
  {
    id: 5,
    title: 'Bà Nà Hills Sun World',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Vui chơi'],
    address: 'Hòa Vang, Đà Nẵng, Việt Nam',
    province: 'Đà Nẵng',
    category: 'attraction',
    description: 'Khu du lịch và nghỉ dưỡng cấp cao.',
    rating: 4.9,
    reviewsCount: 3400,
    price: '900.000 đ',
    content: {
      summary: 'Khu du lịch Bà Nà Hills là quần thể du lịch nghỉ dưỡng kết hợp vui chơi giải trí đẳng cấp bậc nhất Việt Nam.',
      attribution: 'Wikipedia',
      sourceWikiUrl: 'https://vi.wikipedia.org/wiki/B%C3%A0_N%C3%A0_Hills',
    },
  },
  {
    id: 6,
    title: 'Phố cổ Hội An',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Check-in'],
    address: 'Hội An, Quảng Nam, Việt Nam',
    province: 'Hội An, Quảng Nam',
    category: 'sightseeing',
    description: 'Di sản thế giới với những dãy phố đèn lồng lung linh.',
    rating: 4.9,
    reviewsCount: 4100,
    price: 'Miễn phí',
    content: null,
  },
  {
    id: 7,
    title: 'Cần Thơ',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    tags: ['Cà phê'],
    address: 'Ninh Kiều, Cần Thơ, Việt Nam',
    province: 'Hồ Chí Minh',
    category: 'cafe',
    description: 'Vùng đất Tây Đô sông nước hữu tình.',
    rating: 4.3,
    reviewsCount: 120,
    price: '30.000 đ',
    content: null,
  },
];

export const PROVINCES_LIST = [
  'Tỉnh thành',
  'Đà Lạt, Lâm Đồng',
  'Đà Nẵng',
  'Hồ Chí Minh',
  'Hà Nội',
  'Nha Trang, Khánh Hòa',
  'Phú Quốc, Kiên Giang',
  'Hội An, Quảng Nam',
  'Sapa, Lào Cai',
];

export const EXPLORE_CATEGORIES = ['Tất cả', 'Cà phê', 'Ẩm thực', 'Check-in', 'Homestay', 'Tham quan', 'Vui chơi'];