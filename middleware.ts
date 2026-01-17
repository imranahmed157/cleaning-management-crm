import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/auth/login', '/auth/setup-password', '/api/auth', '/api/webhooks']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Not authenticated
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role

  // Role-based access control
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (pathname.startsWith('/manager') && role !== 'MANAGER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (pathname.startsWith('/cleaner') && role !== 'CLEANER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Redirect root to appropriate dashboard
  if (pathname === '/') {
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (role === 'MANAGER') {
      return NextResponse.redirect(new URL('/manager', request.url))
    } else if (role === 'CLEANER') {
      return NextResponse.redirect(new URL('/cleaner', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
