import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { setInviteActive } from '@/lib/data/invites'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; inviteId: string }> }) {
  const { id, inviteId } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'active must be a boolean.' }, { status: 400 })
  }

  const invite = await setInviteActive(id, inviteId, body.active)
  if (!invite) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })
  return NextResponse.json({ invite })
}
