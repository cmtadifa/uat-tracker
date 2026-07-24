'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signAdminSession, verifyAdminPassword } from '@/lib/admin/session'

export async function signInAction(formData: FormData) {
  const password = String(formData.get('password') ?? '')

  if (!(await verifyAdminPassword(password))) {
    redirect(`/admin/login?error=${encodeURIComponent('Incorrect password.')}`)
  }

  const sessionToken = await signAdminSession({ iat: Date.now() })
  const cookieStore = await cookies()
  cookieStore.set('uat_admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect('/admin/dashboard')
}
