import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Direct cookie check to remain 100% Edge-safe without Node.js dependencies
  const sessionToken =
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('better-auth.session_data')?.value;

  const path = request.nextUrl.pathname;

  // Protect /admin and all sub-routes
  if (path.startsWith('/admin')) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
