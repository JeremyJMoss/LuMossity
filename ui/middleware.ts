import { NextRequest, NextResponse } from 'next/server';
import { INTERNAL_API_URL } from './constants/constants';

const HOMEURL = process.env.NEXT_PUBLIC_HOME_URL;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass static files and internal Next.js routes
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

    // If DB is not initialized → redirect to /initialize
    if (dbStatus === 422) {
      if (pathname !== '/initialize') {
        return NextResponse.redirect(`${HOMEURL}/initialize`);
      }
      return NextResponse.next(); // Allow access to /initialize
    }

    // DB initialized, check if user exists
    if (dbStatus === 409) {
      const userResponse = await fetch(`${INTERNAL_API_URL}/user/initial-user`, { method: 'POST' });
      const userStatus = userResponse.status;

      // If user not created → redirect to /initialize/user
      if (userStatus !== 409) {
        if (!pathname.startsWith('/initialize/user')) {
          return NextResponse.redirect(`${HOMEURL}/initialize/user`);
        }
        return NextResponse.next(); // Allow access to /initialize/user
      }

      // 🔒 Prevent returning to init routes post-setup
      if (
        pathname === '/initialize' ||
        pathname.startsWith('/initialize/user')
      ) {
        return NextResponse.redirect(`${HOMEURL}/`);
      }

      // DB and user setup complete → allow any other route
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next(); // Fail-safe
  }
}
