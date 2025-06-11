//----------Dependencies----------//
import { NextRequest, NextResponse } from 'next/server';
import { INTERNAL_API_URL } from './constants/constants';
//----------End Dependencies----------//

//----------Constants----------//
const HOMEURL = process.env.NEXT_PUBLIC_HOME_URL;
//----------End Constants----------//

export async function middleware(req: NextRequest) {
  //----------Derived State----------//
  const { pathname } = req.nextUrl;
  //----------End Derived State----------//

  // Static resources automatically return response
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
    // check if database has been setup
    const dbResponse = await fetch(`${INTERNAL_API_URL}/setup/database`, { method: 'POST' });
    const dbStatus = dbResponse.status;

    // if datbase not setup redirect to initialize route
    if (dbStatus === 422 && pathname !== '/initialize') {
      return NextResponse.redirect(`${HOMEURL}/initialize`);
    }

    if (dbStatus === 409) {
      // Check if initial user is stored in the database
      const userResponse = await fetch(`${INTERNAL_API_URL}/user/initial-user`, { method: 'POST' });
      const userStatus = userResponse.status;


      // if initial user is not stored in the database take user to initialize/user route
      if (userStatus !== 409) {
        if ( !pathname.startsWith('/initialize/user') ) {
            return NextResponse.redirect(`${HOMEURL}/initialize/user`);
        } else {
            return NextResponse.next();
        }
      }

      // if initialized both user and database return the home url if trying to access these routes
      if (
        pathname === '/initialize' ||
        pathname.startsWith('/initialize/user')
      ) {
        return NextResponse.redirect(`${HOMEURL}/`);
      }

      // get session access and request tokens
      const access_token = req.cookies.get('accessToken');
      const refresh_token = req.cookies.get('refreshToken');

      // redirect to login if no tokens exist
      if (!access_token && !refresh_token && pathname !== '/login') {
        return NextResponse.redirect(`${HOMEURL}/login`);
      }

      // Redirect to refresh route in App Router
      if (!access_token && refresh_token && !pathname.startsWith('/auth/refresh')) {
        const redirectUrl = new URL(`${HOMEURL}/auth/refresh`);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Make sure access token is valid
      if (access_token) {
        const authCheck = await fetch(`${INTERNAL_API_URL}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token.value}`,
            },
        });

        // if authentication fails return user to login page
        if ( !authCheck.ok && pathname !== '/login' ) {
            return NextResponse.redirect(`${HOMEURL}/login`);
        }

        // if authentication passes and user is on login page redirect them to home url
        if ( authCheck.ok && pathname === '/login' ) {
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
