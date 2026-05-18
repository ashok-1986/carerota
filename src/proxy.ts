export { auth as proxy } from '@/lib/auth';

export const config = {
  matcher: [
    '/(app)/:path*',     // All authenticated app routes
    '/(staff)/:path*',   // Staff shift view
    '/api/((?!auth).*)', // All API routes except /api/auth/*
  ],
};
