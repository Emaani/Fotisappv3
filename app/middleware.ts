import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/Login', '/signup', '/forgot-password']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const path = request.nextUrl.pathname

  // Allow public paths
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }

  // Protect TradeCommodities and other authenticated routes
  if (!token && path.startsWith('/TradeCommodities')) {
    const loginUrl = new URL('/Login', request.url)
    loginUrl.searchParams.set('returnUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // Add error handling for multipart/form-data requests
  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    try {
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/TradeCommodities/:path*',
    '/ProfileSetup/:path*',
    '/Login',
    '/signup',
    '/api/profile/setup',
    '/api/wallet/:path*'
  ],
} 