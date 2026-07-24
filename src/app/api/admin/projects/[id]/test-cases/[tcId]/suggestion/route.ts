import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { listTestCases } from '@/lib/data/testCases'
import { updateResultSuggestion } from '@/lib/data/results'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; tcId: string }> }) {
  const { id, tcId } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const testCases = await listTestCases(id)
  if (!testCases.some((tc) => tc.id === tcId)) {
    return NextResponse.json({ error: 'Test case not found.' }, { status: 404 })
  }

  const body = await request.json()
  const suggestion = typeof body.suggestion === 'string' ? body.suggestion.trim() || null : null

  const result = await updateResultSuggestion(tcId, suggestion)
  return NextResponse.json({ result })
}
