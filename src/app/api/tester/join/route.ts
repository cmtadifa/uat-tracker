import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findProjectByInviteToken } from '@/lib/data/projects'
import { createRun } from '@/lib/data/runs'
import { signTesterSession } from '@/lib/tester/session'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const token = String((body as { token?: unknown })?.token ?? '')
  const name = String((body as { name?: unknown })?.name ?? '').trim()
  const roleRaw = (body as { role?: unknown })?.role
  const role = typeof roleRaw === 'string' ? roleRaw.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (name.length > 100) return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
  if (role.length > 100) return NextResponse.json({ error: 'Role is too long.' }, { status: 400 })

  const project = await findProjectByInviteToken(token)
  if (!project || !project.inviteActive) {
    return NextResponse.json({ error: 'This UAT link is no longer active.' }, { status: 410 })
  }

  const run = await createRun(project.id, name, role || null)

  const sessionToken = signTesterSession({ projectToken: token, runId: run.id, testerName: name, iat: Date.now() })
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
