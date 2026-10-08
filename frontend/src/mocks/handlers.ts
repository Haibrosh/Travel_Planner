import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/auth/login', async ({ request }) => {
    // Read the request body as JSON
    const body = await request.json() as any;
    
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
    const body = await request.json() as any;

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
