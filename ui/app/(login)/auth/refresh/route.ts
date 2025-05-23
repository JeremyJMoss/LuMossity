import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { INTERNAL_API_URL } from '@/constants/constants';

export async function GET(req: Request) {
  const cookie_store = await cookies();
  const refreshToken = cookie_store.get('refresh_token')?.value;

  if (!refreshToken) {
    return redirect('/login');
  }

  const res = await fetch(`${INTERNAL_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    return redirect('/login');
  }

  // Parse and set access_token from backend's Set-Cookie response
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    return new Response(null, {
      status: 302,
      headers: {
        'Set-Cookie': setCookie,
        Location: req.url.split('?redirect=')[1] || '/',
      },
    });
  }

  return redirect(req.url.split('?redirect=')[1] || '/');
}
