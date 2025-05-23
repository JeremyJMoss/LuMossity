import { cookies } from 'next/headers';
import { INTERNAL_API_URL } from '@/constants/constants';

export async function GET(req: Request) {
  const cookie_store = await cookies();
  const refresh_token = cookie_store.get('refreshToken')?.value;

  if (!refresh_token) {
    return Response.redirect(new URL('/login', req.url));
  }

  const res = await fetch(`${INTERNAL_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      cookie: `refreshToken=${refresh_token}`,
    },
  });

  if (!res.ok) {
    return Response.redirect(new URL('/login', req.url));
  }

  const setCookie = res.headers.get('set-cookie');
  const redirectUrl = new URL(req.url).searchParams.get('redirect') || '/';

  if (setCookie) {
    return new Response(null, {
      status: 302,
      headers: {
        'Set-Cookie': setCookie,
        Location: redirectUrl,
      },
    });
  }

  return Response.redirect(new URL(redirectUrl, req.url));
}
