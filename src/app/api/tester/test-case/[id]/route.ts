import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findProjectByInviteToken } from '@/lib/data/projects'
import { listTestCases } from '@/lib/data/testCases'
import { getResult, updateResult } from '@/lib/data/results'
import { verifyTesterSession, type TesterSessionPayload } from '@/lib/tester/session'
import { validateStatusUpdate } from '@/lib/validation'
import type { Project } from '@/lib/types'

async function getVerifiedSession(): Promise<TesterSessionPayload | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_tester_session')?.value
  return sessionCookie ? verifyTesterSession(sessionCookie) : null
}

async function getActiveProjectForSession(session: TesterSessionPayload): Promise<Project | null> {
  const project = await findProjectByInviteToken(session.projectToken)
  return project && project.inviteActive ? project : null
}

async function findTestCaseInProject(projectId: string, testCaseId: string) {
  const testCases = await listTestCases(projectId)
  return testCases.find((tc) => tc.id === testCaseId) ?? null
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  const project = await getActiveProjectForSession(session)
  if (!project) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const testCase = await findTestCaseInProject(project.id, id)
  if (!testCase) return NextResponse.json({ error: 'Test case not found.' }, { status: 404 })

  const result = await getResult(session.runId, id)

  return NextResponse.json({
    id: testCase.id,
    title: testCase.title,
    steps: testCase.steps,
    expectedResult: testCase.expectedResult,
    status: result?.status ?? 'not_started',
    failReason: result?.failReason ?? null,
  })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  const project = await getActiveProjectForSession(session)
  if (!project) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const body = await request.json()
  const status = body.status
  const failReason = body.failReason ?? null
  if (status !== 'passed' && status !== 'failed') {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const validation = validateStatusUpdate({ status, failReason })
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })

  const testCase = await findTestCaseInProject(project.id, id)
  if (!testCase) return NextResponse.json({ error: 'Test case not found.' }, { status: 404 })

  await updateResult(session.runId, id, { status, testerName: session.testerName, failReason })
  return NextResponse.json({ ok: true })
}
