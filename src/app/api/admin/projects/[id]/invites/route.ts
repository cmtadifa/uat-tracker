import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { createInvite } from '@/lib/data/invites'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invite = await createInvite(id)
  return NextResponse.json({ invite }, { status: 201 })
}
