import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PAGES = [
  '/dashboard',
  '/rota',
  '/staff',
  '/leave',
  '/settings',
  '/export',
  '/my-shifts',
];

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedPage && !session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rota/:path*',
    '/staff/:path*',
    '/leave/:path*',
    '/settings/:path*',
    '/export/:path*',
    '/my-shifts/:path*',
  ],
};
