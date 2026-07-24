import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { listProjects, createProject } from '@/lib/data/projects'
import { listRuns } from '@/lib/data/runs'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'
import { countByStatus } from '@/lib/aggregate'

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await listProjects()
  const projectSummaries = await Promise.all(
    projects.map(async (p) => {
      const [testCases, runs] = await Promise.all([listTestCases(p.id), listRuns(p.id)])
      const statuses = await Promise.all(
        testCases.flatMap((tc) =>
          runs.map(async (run) => ({ status: (await getResult(run.id, tc.id))?.status ?? 'not_started' }))
        )
      )
      const counts = countByStatus(statuses)
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        inviteToken: p.inviteToken,
        inviteActive: p.inviteActive,
        createdAt: p.createdAt,
        testerCount: runs.length,
        counts,
      }
    })
  )

  const totalFailures = projectSummaries.reduce((sum, p) => sum + p.counts.failed, 0)

  return NextResponse.json({
    projects: projectSummaries,
    summary: { activeProjects: projectSummaries.length, totalFailures },
  })
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Project name is required.' }, { status: 400 })

  const project = await createProject({ name, description: body.description ?? null })
  return NextResponse.json({ project }, { status: 201 })
}
