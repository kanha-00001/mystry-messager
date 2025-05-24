import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 🟡 Remove this line — you are already defining custom middleware below
// export { default } from "next-auth/middleware";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // If user is authenticated and tries to visit sign-in, sign-up, verify, or root path
  if (
    token &&
    (
      url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') ||
      url.pathname.startsWith('/verify') ||
      url.pathname === '/'
    )
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT authenticated and trying to access protected routes like /dashboard
  if (
    !token &&
    (
      url.pathname.startsWith('/dashboard')     )
  ) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Otherwise, continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/',
    '/dashboard/:path*',
  ],
};
