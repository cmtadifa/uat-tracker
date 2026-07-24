import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { updateTestCase, deleteTestCase } from '@/lib/data/testCases'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; tcId: string }> }) {
  const { id, tcId } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const update: {
    title?: string
    expectedResult?: string
    steps?: string[]
    orderIndex?: number
    suggestion?: string | null
  } = {}
  if (typeof body.title === 'string') {
    const trimmedTitle = body.title.trim()
    if (!trimmedTitle) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    update.title = trimmedTitle
  }
  if (typeof body.expectedResult === 'string') {
    const trimmedExpected = body.expectedResult.trim()
    if (!trimmedExpected) return NextResponse.json({ error: 'Expected result is required.' }, { status: 400 })
    update.expectedResult = trimmedExpected
  }
  if (Array.isArray(body.steps)) update.steps = body.steps.filter((s: string) => s.trim().length > 0)
  if (typeof body.orderIndex === 'number') update.orderIndex = body.orderIndex
  if (typeof body.suggestion === 'string') update.suggestion = body.suggestion.trim() || null

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
