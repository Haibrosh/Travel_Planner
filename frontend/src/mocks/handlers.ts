import { http, HttpResponse } from 'msw';
import type { LoginRequest, RegisterRequest } from '@/types/auth';
import type { CreateTripRequest, TripResponse, UpdateTripRequest } from '@/types/trip';
import {
  DEFAULT_DESTINATIONS,
  EXPLORE_PLACES_MOCK,
  mapMockItemToPlace,
} from '@/mocks/exploreData';

let mockTrips: TripResponse[] = [
  {
    tripId: 1,
    ownerId: 1,
    ownerUsername: 'haileader',
    provinceCode: '77',
    destinationName: 'Bà Rịa - Vũng Tàu',
    destinationSlug: 'ba-ria-vung-tau',
    name: 'Khám phá Vũng Tàu cuối tuần',
    description: 'Chuyến đi nghỉ dưỡng ngắm bình minh biển Vũng Tàu cùng nhóm bạn.',
    startDate: '2026-11-14',
    endDate: '2026-11-16',
    status: 'PLANNING',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    tripId: 2,
    ownerId: 1,
    ownerUsername: 'haileader',
    provinceCode: '68',
    destinationName: 'Lâm Đồng (Đà Lạt)',
    destinationSlug: 'lam-dong',
    name: 'Đà Lạt Săn Mây & Cà Phê Đồi Thông',
    description: 'Lịch trình săn mây Cầu Đất, cà phê Túi Mơ To và thưởng thức lẩu gà lá é.',
    startDate: '2026-12-05',
    endDate: '2026-12-08',
    status: 'PLANNING',
    createdAt: '2026-10-22T08:30:00Z',
    updatedAt: '2026-10-22T08:30:00Z',
  },
];

export const handlers = [
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as Partial<LoginRequest>;

    if (body?.email === 'test@example.com' && body?.password === 'password') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        email: 'test@example.com',
        username: 'testuser',
      });
    }

    return HttpResponse.json(
      {
        status: 401,
        error: 'Unauthorized',
        message: 'Email hoặc mật khẩu không chính xác.',
      },
      { status: 401 }
    );
  }),

  http.post('*/auth/register', async ({ request }) => {
    const body = (await request.json()) as Partial<RegisterRequest>;

    return HttpResponse.json({
      token: 'mock-jwt-token-new',
      email: body?.email || 'new@example.com',
      username: body?.username || 'newuser',
    });
  }),

  // Mock API Destinations
  http.get('*/api/v1/destinations', () => {
    return HttpResponse.json(DEFAULT_DESTINATIONS);
  }),

  http.get('*/api/destinations', () => {
    return HttpResponse.json(DEFAULT_DESTINATIONS);
  }),

  // Mock API Places
  http.get('*/api/v1/places', ({ request }) => {
    const url = new URL(request.url);
    const destinationId = (url.searchParams.get('destinationId') || '').toLowerCase();
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const category = url.searchParams.get('category') || 'all';
    const sort = url.searchParams.get('sort') || 'popular';
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 8);

    let list = EXPLORE_PLACES_MOCK.map(mapMockItemToPlace).filter((place) => {
      const matchDest =
        !destinationId ||
        place.provinceCode?.toLowerCase() === destinationId ||
        place.destinationName?.toLowerCase().includes(destinationId) ||
        place.address.toLowerCase().includes(destinationId);

      const matchQ =
        !q ||
        place.name.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q);

      const matchCat =
        !category ||
        category === 'all' ||
        place.category.toLowerCase() === category.toLowerCase();

      return matchDest && matchQ && matchCat;
    });

    if (sort === 'rating_desc') {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === 'name_asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else {
      list = [...list].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    }

    const totalElements = list.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const startIndex = (page - 1) * size;
    const content = list.slice(startIndex, startIndex + size);

    return HttpResponse.json({
      content,
      page,
      size,
      totalElements,
      totalPages,
    });
  }),

  http.get('*/api/v1/places/:id', ({ params }) => {
    const id = Number(params.id);
    const found = EXPLORE_PLACES_MOCK.find((p) => p.id === id);
    if (!found) {
      return HttpResponse.json({ message: 'Không tìm thấy địa điểm' }, { status: 404 });
    }
    return HttpResponse.json(mapMockItemToPlace(found));
  }),

  // Mock API Trips
  http.get('*/api/v1/trips', () => {
    return HttpResponse.json(mockTrips);
  }),

  http.get('*/api/v1/trips/:id', ({ params }) => {
    const tripId = Number(params.id);
    const trip = mockTrips.find((t) => t.tripId === tripId);
    if (!trip) {
      return HttpResponse.json(
        { message: `Không tìm thấy chuyến đi với ID: ${tripId}` },
        { status: 404 }
      );
    }
    return HttpResponse.json(trip);
  }),

  http.post('*/api/v1/trips', async ({ request }) => {
    const body = (await request.json()) as CreateTripRequest;
    const dest = DEFAULT_DESTINATIONS.find((d) => d.provinceCode === body.provinceCode);
    const newTrip: TripResponse = {
      tripId: Date.now(),
      ownerId: 1,
      ownerUsername: 'haileader',
      provinceCode: body.provinceCode || '68',
      destinationName: dest?.name || 'Lâm Đồng (Đà Lạt)',
      destinationSlug: dest?.slug || 'lam-dong',
      name: body.name,
      description: body.description || null,
      startDate: body.startDate,
      endDate: body.endDate,
      status: 'PLANNING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTrips = [newTrip, ...mockTrips];
    return HttpResponse.json(newTrip, { status: 201 });
  }),

  http.put('*/api/v1/trips/:id', async ({ params, request }) => {
    const tripId = Number(params.id);
    const body = (await request.json()) as UpdateTripRequest;
    const index = mockTrips.findIndex((t) => t.tripId === tripId);
    if (index === -1) {
      return HttpResponse.json(
        { message: `Không tìm thấy chuyến đi với ID: ${tripId}` },
        { status: 404 }
      );
    }
    const dest = DEFAULT_DESTINATIONS.find((d) => d.provinceCode === body.provinceCode);
    const updatedTrip: TripResponse = {
      ...mockTrips[index],
      provinceCode: body.provinceCode || mockTrips[index].provinceCode,
      destinationName: dest?.name || mockTrips[index].destinationName,
      destinationSlug: dest?.slug || mockTrips[index].destinationSlug,
      name: body.name,
      description: body.description ?? null,
      startDate: body.startDate,
      endDate: body.endDate,
      updatedAt: new Date().toISOString(),
    };
    mockTrips[index] = updatedTrip;
    return HttpResponse.json(updatedTrip);
  }),

  http.delete('*/api/v1/trips/:id', ({ params }) => {
    const tripId = Number(params.id);
    mockTrips = mockTrips.filter((t) => t.tripId !== tripId);
    return HttpResponse.json({ message: 'Xóa chuyến đi thành công.' });
  }),
];
