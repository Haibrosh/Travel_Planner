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
}

export const EXPLORE_PLACES_MOCK: PlaceItem[] = [
  {
    id: 1,
    title: 'Quảng trường Lâm Viên',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Chụp ảnh'],
    address: 'Đ. Trần Quốc Toản, Xuân Hương - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'sightseeing',
    description: 'Biểu tượng du lịch nổi tiếng của thành phố sương mù.',
    rating: 4.8,
    reviewsCount: 1240,
    price: 'Miễn phí'
  },
  {
    id: 2,
    title: 'Tiệm Cà Phê Túi Mơ To',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Cà phê', 'Chụp ảnh'],
    address: 'Hẻm 31 Sào Nam, Xuân Trường - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'cafe',
    description: 'Không gian cà phê mộc mạc ngập tràn cúc họa mi.',
    rating: 4.7,
    reviewsCount: 950,
    price: '40.000 đ'
  },
  {
    id: 3,
    title: 'Vườn hoa Thành phố Đà Lạt',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Chụp ảnh'],
    address: '02 Đ. Trần Nhân Tông, Lâm Viên - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'sightseeing',
    description: 'Nơi quy tụ hàng trăm giống hoa khoe sắc quanh năm.',
    rating: 4.5,
    reviewsCount: 850,
    price: '50.000 đ'
  },
  {
    id: 4,
    title: 'Lẩu gà lá é Tao Ngộ',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực'],
    address: '10Bis Ba Tháng Tư, Xuân Hương - Đà Lạt, Lâm Đồng, Việt Nam',
    province: 'Đà Lạt, Lâm Đồng',
    category: 'food',
    description: 'Món ăn đặc sản nóng hổi thơm nức mùi lá é.',
    rating: 4.6,
    reviewsCount: 1120,
    price: '200.000 đ'
  },
  {
    id: 5,
    title: 'Bà Nà Hills Sun World',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Vui chơi'],
    address: 'Hòa Vang, Đà Nẵng, Việt Nam',
    province: 'Đà Nẵng',
    category: 'attraction',
    description: 'Khu du lịch và nghỉ dưỡng đẳng cấp.',
    rating: 4.9,
    reviewsCount: 3400,
    price: '900.000 đ'
  },
  {
    id: 6,
    title: 'Phố cổ Hội An',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Tham quan', 'Chụp ảnh'],
    address: 'Hội An, Quảng Nam, Việt Nam',
    province: 'Hội An, Quảng Nam',
    category: 'sightseeing',
    description: 'Di sản văn hóa thế giới với những dãy phố đèn lồng lung linh.',
    rating: 4.9,
    reviewsCount: 4100,
    price: 'Miễn phí'
  },
  {
    id: 7,
    title: 'Cà phê Mỹ Khánh',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    tags: ['Cà phê'],
    address: 'Ninh Kiều, Cần Thơ, Việt Nam',
    province: 'Hồ Chí Minh',
    category: 'cafe',
    description: 'Điểm dừng chân thư giãn.',
    rating: 4.3,
    reviewsCount: 120,
    price: '30.000 đ'
  }
];

export const PROVINCES_LIST = [
  'Tất cả tỉnh thành',
  'Đà Lạt, Lâm Đồng',
  'Đà Nẵng',
  'Hồ Chí Minh',
  'Hà Nội',
  'Nha Trang, Khánh Hòa',
  'Phú Quốc, Kiên Giang',
  'Hội An, Quảng Nam',
  'Sapa, Lào Cai'
];

export const EXPLORE_CATEGORIES = ['Tất cả', 'Cà phê', 'Ẩm thực', 'Chụp ảnh', 'Homestay', 'Tham quan', 'Vui chơi'];