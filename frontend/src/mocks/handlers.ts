import { http, HttpResponse } from 'msw';
import type { LoginRequest, RegisterRequest } from '@/types/auth';
import type { CreateTripRequest, TripResponse } from '@/types/trip';

let mockTrips: TripResponse[] = [
  {
    tripId: 1,
    ownerId: 1,
    ownerUsername: 'haileader',
    destinationId: 1,
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
    destinationId: 2,
    name: 'Food Tour Sài Gòn & Check-in Landmark',
    description: 'Lịch trình ăn sập Sài Gòn, cà phê bệt và ngắm hoàng hôn sông Sài Gòn.',
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
    const newTrip: TripResponse = {
      tripId: Date.now(),
      ownerId: 1,
      ownerUsername: 'haileader',
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

  http.delete('*/api/v1/trips/:id', ({ params }) => {
    const tripId = Number(params.id);
    mockTrips = mockTrips.filter((t) => t.tripId !== tripId);
    return HttpResponse.json({ message: 'Xóa chuyến đi thành công.' });
  }),
];
