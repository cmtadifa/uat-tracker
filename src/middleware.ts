import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middlewareClient'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

  if (isAdminPath && !isLoginPage && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
