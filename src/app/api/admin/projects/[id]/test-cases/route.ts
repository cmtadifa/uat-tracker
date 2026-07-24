import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { createTestCase } from '@/lib/data/testCases'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const title = String(body.title ?? '').trim()
  const expectedResult = String(body.expectedResult ?? '').trim()
  const steps: string[] = Array.isArray(body.steps)
    ? body.steps.filter((s: string) => s.trim().length > 0)
    : []

  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!expectedResult) return NextResponse.json({ error: 'Expected result is required.' }, { status: 400 })

  const testCase = await createTestCase(id, { title, steps, expectedResult })
  return NextResponse.json({ testCase }, { status: 201 })
}
