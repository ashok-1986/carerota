import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MANAGER_ROLES = ['home_manager', 'manager', 'admin'] as const;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bypass static assets, internal Next.js paths, and public auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/verify-email' ||
    pathname.startsWith('/verify-email/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Resolve token using Auth.js v5 cookie conventions
  const hasSecureCookie = req.cookies.has('__Secure-authjs.session-token');
  const isHttps = req.nextUrl.protocol === 'https:';
  const preferSecure = hasSecureCookie || isHttps;

  let token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: preferSecure,
  });

  // Fallback between secure and non-secure cookie names if running in dev/http or behind proxy
  if (!token && preferSecure && req.cookies.has('authjs.session-token')) {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: false,
    });
  } else if (!token && !preferSecure && hasSecureCookie) {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
    });
  }

  // 3. Handle unauthenticated requests
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', req.url);
    const callbackUrl = pathname === '/' ? '/dashboard' : `${pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based authorization
  const userRole = typeof token.role === 'string' ? token.role : '';
  const isManager = MANAGER_ROLES.includes(userRole as (typeof MANAGER_ROLES)[number]);

  if (!isManager) {
    // Restrict access to /settings and /export pages
    const isRestrictedPage =
      pathname === '/settings' ||
      pathname.startsWith('/settings/') ||
      pathname === '/export' ||
      pathname.startsWith('/export/');

    if (isRestrictedPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Restrict writes to /api/settings/* and /api/export/*
    const isRestrictedApi =
      pathname.startsWith('/api/settings') ||
      pathname.startsWith('/api/export');
    const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    if (isRestrictedApi && isWriteMethod) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (metadata files)
     * - static asset extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     * - public auth pages (/login, /verify-email)
     * - auth api routes (/api/auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|verify-email|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
