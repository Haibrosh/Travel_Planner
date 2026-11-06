import { http, HttpResponse } from 'msw';
import type { LoginRequest, RegisterRequest } from '@/types/auth';
import type { CreateTripRequest, TripResponse } from '@/types/trip';

let mockTrips: TripResponse[] = [
  {
    tripId: 1,
    ownerId: 1,
    ownerUsername: 'traveler_pro',
    destinationId: 1,
    name: 'Khám phá Vũng Tàu cuối tuần',
    description: 'Chuyến đi nghỉ dưỡng ngắm bình minh biển.',
    startDate: '2026-11-14',
    endDate: '2026-11-16',
    status: 'PLANNING',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    tripId: 2,
    ownerId: 1,
    ownerUsername: 'traveler_pro',
    destinationId: 2,
    name: 'Food Tour Sài Gòn & Check-in Landmark',
    description: 'Lịch trình ăn uống, cà phê ngắm hoàng hôn.',
    startDate: '2026-12-05',
    endDate: '2026-12-07',
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

  // Lấy danh sách chuyến đi
  http.get('*/api/v1/trips', () => {
    return HttpResponse.json(mockTrips);
  }),

  // Lấy chi tiết chuyến đi theo ID (Hỗ trợ tìm kiếm linh hoạt cả số lẫn chữ/slug)
  http.get('*/api/v1/trips/:id', ({ params }) => {
    const rawId = params.id as string;
    const tripId = Number(rawId);
    
    let trip = mockTrips.find((t) => t.tripId === tripId || String(t.tripId) === rawId);
    
    // Dự phòng tự động nếu không tìm thấy ID trên URL để test UI mượt mà
    if (!trip) {
      trip = {
        tripId: isNaN(tripId) ? 1 : tripId,
        ownerId: 1,
        ownerUsername: 'traveler_pro',
        destinationId: 1,
        name: `Hành trình khám phá #${rawId}`,
        description: 'Dữ liệu dự phòng tự động cho không gian làm việc.',
        startDate: '2026-11-07',
        endDate: '2026-11-10',
        status: 'PLANNING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return HttpResponse.json(trip);
  }),

  // Tạo mới chuyến đi
  http.post('*/api/v1/trips', async ({ request }) => {
    const body = (await request.json()) as CreateTripRequest;
    const newTrip: TripResponse = {
      tripId: Date.now(),
      ownerId: 1,
      ownerUsername: 'traveler_pro',
      destinationId: body.destinationId || 1,
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

  // Xóa chuyến đi
  http.delete('*/api/v1/trips/:id', ({ params }) => {
    const tripId = Number(params.id);
    mockTrips = mockTrips.filter((t) => t.tripId !== tripId);
    return HttpResponse.json({ message: 'Xóa chuyến đi thành công.' });
  }),
];