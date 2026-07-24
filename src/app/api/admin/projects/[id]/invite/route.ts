import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { updateProjectInvite } from '@/lib/data/projects'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const action = body.action
  if (action !== 'regenerate' && action !== 'revoke' && action !== 'reactivate') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }

  const project = await updateProjectInvite(id, action)
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

  return NextResponse.json({ project })
}
