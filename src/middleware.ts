import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdminSession } from '@/lib/admin/session'

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

  if (isAdminPath && !isLoginPage) {
    const sessionCookie = request.cookies.get('uat_admin_session')?.value
    const session = sessionCookie ? verifyAdminSession(sessionCookie) : null
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
