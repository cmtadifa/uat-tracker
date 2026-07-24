import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { findProjectByInviteToken } from '@/lib/data/projects'
import { listTestCases } from '@/lib/data/testCases'
import { addScreenshot } from '@/lib/data/results'
import { getEvidenceStore } from '@/lib/data/store'
import { verifyTesterSession } from '@/lib/tester/session'
import { validateScreenshotFile } from '@/lib/validation'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_tester_session')?.value
  const session = sessionCookie ? verifyTesterSession(sessionCookie) : null
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const formData = await request.formData()
  const testCaseId = String(formData.get('testCaseId') ?? '')
  const files = formData.getAll('files').filter((f): f is File => f instanceof File)

  const project = await findProjectByInviteToken(session.projectToken)
  if (!project || !project.inviteActive) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }

  const testCases = await listTestCases(project.id)
  const testCase = testCases.find((tc) => tc.id === testCaseId)
  if (!testCase) {
    return NextResponse.json({ error: 'Test case not found.' }, { status: 404 })
  }

  const evidenceStore = getEvidenceStore()
  const uploaded: string[] = []
  for (const file of files) {
    const validation = validateScreenshotFile({ type: file.type, size: file.size })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const storagePath = `${project.id}/${testCaseId}/${randomUUID()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    await evidenceStore.set(storagePath, arrayBuffer, { metadata: { contentType: file.type } })

    await addScreenshot(testCaseId, { id: randomUUID(), storagePath, uploadedAt: new Date().toISOString() })
    uploaded.push(storagePath)
  }

  return NextResponse.json({ uploaded })
}
