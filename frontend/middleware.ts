// middleware.js

import { NextRequest, NextResponse } from 'next/server';
const APIURL = process.env.NEXT_PUBLIC_API_URL;
const HOMEURL = process.env.NEXT_PUBLIC_HOME_URL;

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
  
    // Skip checks for these paths
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
      // 1. Check if database is initialized
      const dbResponse = await fetch(`${APIURL}/api/setup/database`, { method: 'POST' });
      const dbStatus = dbResponse.status;
  
      if (dbStatus === 422 && !pathname.startsWith('/initialize')) {
        // Database not initialized -> redirect to /initialize
        return NextResponse.redirect(`${HOMEURL}/initialize`);
      }
  
      if (dbStatus === 400) {
        // 2. If database returns 400, check if the initial user exists
        const userResponse = await fetch(`${APIURL}/api/user/initial-user`, { method: 'POST' });
        const userStatus = userResponse.status;
  
        if (userStatus !== 409 && !pathname.startsWith('/initialize/user')) {
          // No initial user -> redirect to /initialize/user
          return NextResponse.redirect(`${HOMEURL}/initialize/user`);
        }
      }
  
      // Otherwise, everything is okay, continue
      return NextResponse.next();
  
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.next(); // Fail safe: don't block users if middleware errors
    }
  }
