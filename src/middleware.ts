import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Direct cookie check to remain 100% Edge-safe without Node.js dependencies
  const sessionToken =
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('better-auth.session_data')?.value;

  // 2. Allow public authentication endpoints and webhooks
  if (path.startsWith('/api/auth') || path.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // 3. Handle /login route
  if (path === '/login') {
    // If user is already authenticated, redirect them directly to destination or home
    if (sessionToken) {
      const redirectParam = request.nextUrl.searchParams.get('redirect');
      const destination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // 4. Protect all other application routes & APIs (True SaaS gating)
  if (!sessionToken) {
    // For API requests, return 401 Unauthorized
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    // For page navigation, redirect to /login
    const loginUrl = new URL('/login', request.url);
    if (path !== '/') {
      loginUrl.searchParams.set('redirect', path);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static chunks)
     * - _next/image (image optimization)
     * - favicon.ico, icon.png
     * - Static asset files (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .pdf, .txt)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|txt)$).*)',
  ],
};
