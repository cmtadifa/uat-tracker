import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { getProjectSummary } from '@/lib/data/projects'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProjectSummary(id)
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

  const testCaseMetas = await listTestCases(id)
  const testCases = await Promise.all(
    testCaseMetas.map(async (tc) => ({
      ...tc,
      result: (await getResult(tc.id)) ?? {
        id: tc.id,
        testCaseId: tc.id,
        status: 'not_started' as const,
        testerName: null,
        failReason: null,
        suggestion: null,
        updatedAt: project.createdAt,
        screenshots: [],
      },
    }))
  )

  return NextResponse.json({ project, testCases })
}
