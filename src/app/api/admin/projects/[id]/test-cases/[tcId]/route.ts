import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { updateTestCase, deleteTestCase } from '@/lib/data/testCases'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; tcId: string }> }) {
  const { id, tcId } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const update: { title?: string; expectedResult?: string; steps?: string[]; orderIndex?: number } = {}
  if (typeof body.title === 'string') update.title = body.title.trim()
  if (typeof body.expectedResult === 'string') update.expectedResult = body.expectedResult.trim()
  if (Array.isArray(body.steps)) update.steps = body.steps.filter((s: string) => s.trim().length > 0)
  if (typeof body.orderIndex === 'number') update.orderIndex = body.orderIndex

  const testCase = await updateTestCase(id, tcId, update)
  if (!testCase) return NextResponse.json({ error: 'Test case not found.' }, { status: 404 })
  return NextResponse.json({ testCase })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; tcId: string }> }) {
  const { id, tcId } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteTestCase(id, tcId)
  return NextResponse.json({ ok: true })
}
