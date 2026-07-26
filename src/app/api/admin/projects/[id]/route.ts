import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { getProjectSummary, updateProjectDetails } from '@/lib/data/projects'
import { listRuns } from '@/lib/data/runs'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProjectSummary(id)
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

  const [runs, testCaseMetas] = await Promise.all([listRuns(id), listTestCases(id)])

  const testCases = await Promise.all(
    testCaseMetas.map(async (tc) => {
      const results = await Promise.all(
        runs.map(async (run) => ({
          run,
          result: (await getResult(run.id, tc.id)) ?? {
            id: `${run.id}:${tc.id}`,
            testCaseId: tc.id,
            runId: run.id,
            status: 'not_started' as const,
            testerName: run.testerName,
            failReason: null,
            updatedAt: run.startedAt,
            screenshots: [],
          },
        }))
      )
      return { ...tc, results }
    })
  )

  return NextResponse.json({ project, runs, testCases })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const update: { name?: string; description?: string | null } = {}
  if (typeof body.name === 'string') {
    const trimmedName = body.name.trim()
    if (!trimmedName) return NextResponse.json({ error: 'Project name is required.' }, { status: 400 })
    update.name = trimmedName
  }
  if (typeof body.description === 'string') update.description = body.description.trim() || null

  const project = await updateProjectDetails(id, update)
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  return NextResponse.json({ project })
}
