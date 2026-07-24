import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findProjectByInviteToken } from '@/lib/data/projects'
import { signTesterSession } from '@/lib/tester/session'

export async function POST(request: Request) {
  const body = await request.json()
  const token = String(body.token ?? '')
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  const project = await findProjectByInviteToken(token)
  if (!project || !project.inviteActive) {
    return NextResponse.json({ error: 'This UAT link is no longer active.' }, { status: 410 })
  }

  const sessionToken = signTesterSession({ projectToken: token, testerName: name, iat: Date.now() })
  const cookieStore = await cookies()
  cookieStore.set('uat_tester_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ ok: true })
}
