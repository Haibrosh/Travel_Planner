import { http, HttpResponse } from 'msw';
import type { LoginRequest } from '../types/auth';

type MockRegisterBody = { name?: string; email?: string };

export const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = (await request.json()) as Partial<LoginRequest>;
    
    if (body?.email === 'test@example.com' && body?.password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'mock-jwt-token',
      });
    }

    return new HttpResponse(null, {
      status: 401,
      statusText: 'Unauthorized',
    });
  }),

  http.post('/auth/register', async ({ request }) => {
    const body = (await request.json()) as MockRegisterBody;

    return HttpResponse.json({
      user: {
        id: '2',
        name: body?.name || 'New User',
        email: body?.email || 'new@example.com',
      },
      token: 'mock-jwt-token-new',
    }, { status: 201 });
  }),
];
