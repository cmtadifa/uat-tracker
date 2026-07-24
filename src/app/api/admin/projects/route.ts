import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/admin/session'
import { countByStatus } from '@/lib/aggregate'

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseServiceClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      'id, name, description, invite_token, invite_active, created_at, ' +
        'test_cases(results(id, test_case_id, status, tester_name, fail_reason, updated_at))'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projectSummaries = (projects ?? []).map((p: any) => {
    const results = (p.test_cases ?? []).flatMap((tc: any) => tc.results ?? [])
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      inviteToken: p.invite_token,
      inviteActive: p.invite_active,
      createdAt: p.created_at,
      counts: countByStatus(results),
    }
  })

  const totalFailures = projectSummaries.reduce((sum, p) => sum + p.counts.failed, 0)

  return NextResponse.json({
    projects: projectSummaries,
    summary: { activeProjects: projectSummaries.length, totalFailures },
  })
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseServiceClient()

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Project name is required.' }, { status: 400 })

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description: body.description ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
