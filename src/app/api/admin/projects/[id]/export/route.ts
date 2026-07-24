import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { getProjectSummary } from '@/lib/data/projects'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  passed: 'Passed',
  failed: 'Failed',
}

function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function csvRow(values: string[]): string {
  return values.map(csvField).join(',') + '\r\n'
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProjectSummary(id)
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

  const testCases = await listTestCases(id)
  const rows = await Promise.all(
    testCases.map(async (tc) => {
      const result = await getResult(tc.id)
      return csvRow([
        tc.title,
        tc.steps.join(' | '),
        tc.expectedResult,
        STATUS_LABELS[result?.status ?? 'not_started'] ?? 'Not Started',
        result?.testerName ?? '',
        result?.failReason ?? '',
        result?.suggestion ?? '',
        result?.updatedAt ? new Date(result.updatedAt).toLocaleString() : '',
      ])
    })
  )

  const header = csvRow(['Question', 'Steps', 'Expected Result', 'Status', 'Tested By', 'Fail Reason', 'Suggestion', 'Last Updated'])
  const csv = header + rows.join('')

  const slug = project.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'uat-results'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-results.csv"`,
    },
  })
}
