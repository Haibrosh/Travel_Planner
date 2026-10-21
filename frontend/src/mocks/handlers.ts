import { http, HttpResponse } from 'msw';
import type { LoginRequest, RegisterRequest } from '@/types/auth';

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
];

