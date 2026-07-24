import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { getEvidenceStore } from '@/lib/data/store'

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const storagePath = path.join('/')
  const store = getEvidenceStore()
  const result = await store.getWithMetadata(storagePath, { type: 'arrayBuffer' })
  if (!result) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const { data, metadata } = result

  return new NextResponse(data, {
    headers: { 'Content-Type': (metadata?.contentType as string | undefined) ?? 'application/octet-stream' },
  })
}
