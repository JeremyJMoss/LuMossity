import { NextRequest, NextResponse } from 'next/server';
import { INTERNAL_API_URL } from './constants/constants';
import { access } from 'fs';

const HOMEURL = process.env.NEXT_PUBLIC_HOME_URL;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts')
  ) {
    return NextResponse.next();
  }

  try {
    const dbResponse = await fetch(`${INTERNAL_API_URL}/setup/database`, { method: 'POST' });
    const dbStatus = dbResponse.status;

    if (dbStatus === 422 && pathname !== '/initialize') {
      return NextResponse.redirect(`${HOMEURL}/initialize`);
    }

    if (dbStatus === 409) {
      const userResponse = await fetch(`${INTERNAL_API_URL}/user/initial-user`, { method: 'POST' });
      const userStatus = userResponse.status;

      if (userStatus !== 409 && !pathname.startsWith('/initialize/user')) {
        return NextResponse.redirect(`${HOMEURL}/initialize/user`);
      }

      if (
        pathname === '/initialize' ||
        pathname.startsWith('/initialize/user')
      ) {
        return NextResponse.redirect(`${HOMEURL}/`);
      }

      const access_token = req.cookies.get('accessToken');
      const refresh_token = req.cookies.get('refreshToken');

      if (!access_token && !refresh_token && pathname !== '/login') {
        return NextResponse.redirect(`${HOMEURL}/login`);
      }

      // Redirect to refresh route in App Router
      if (!access_token && refresh_token && !pathname.startsWith('/auth/refresh')) {
        const redirectUrl = new URL(`${HOMEURL}/auth/refresh`);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      if (access_token) {
        const authCheck = await fetch(`${INTERNAL_API_URL}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token.value}`,
            },
        });

        if ( !authCheck.ok && pathname !== '/login' ) {
            return NextResponse.redirect(`${HOMEURL}/login`);
        }

        if (authCheck.ok && pathname === '/login') {
            return NextResponse.redirect(`${HOMEURL}`);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}
