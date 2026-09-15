import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public page routes accessible without login
const PUBLIC_ROUTES = ['/login'];

// Public API routes accessible without token header/cookie
const PUBLIC_API_ROUTES = ['/api/proxy/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('admin_token')?.value;

  // 1. API proxy security protection
  if (pathname.startsWith('/api/proxy')) {
    const isPublicApi = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
    const authHeader = request.headers.get('authorization');
    
    // Check if valid token exists in cookie or Authorization Bearer header
    const hasToken = Boolean(token || (authHeader && authHeader.startsWith('Bearer ')));

    if (!isPublicApi && !hasToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid admin session token required.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 2. Protect all admin pages: redirect unauthenticated users to /login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 3. Redirect authenticated users away from /login to /dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Handle root / route
  if (pathname === '/') {
    const targetPath = token ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public files with extensions (.png, .jpg, .svg, .ico, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
