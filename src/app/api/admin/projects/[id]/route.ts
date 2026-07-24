import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/admin/session'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseServiceClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, description, invite_token, invite_active, created_at')
    .eq('id', id)
    .single()
  if (projectError) return NextResponse.json({ error: projectError.message }, { status: 404 })

  const { data: testCases, error: tcError } = await supabase
    .from('test_cases')
    .select(
      'id, title, steps, expected_result, order_index, ' +
        'results(id, status, tester_name, fail_reason, updated_at, screenshots(id, storage_path, uploaded_at))'
    )
    .eq('project_id', id)
    .order('order_index', { ascending: true })
  if (tcError) return NextResponse.json({ error: tcError.message }, { status: 500 })

  return NextResponse.json({ project, testCases })
}
