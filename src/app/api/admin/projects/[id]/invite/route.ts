import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/admin/session'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseServiceClient()

  const body = await request.json()
  const action = body.action

  let update: Record<string, unknown>
  if (action === 'regenerate') update = { invite_token: randomUUID(), invite_active: true }
  else if (action === 'revoke') update = { invite_active: false }
  else if (action === 'reactivate') update = { invite_active: true }
  else return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })

  const { data, error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', id)
    .select('id, invite_token, invite_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}
