import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findProjectByInviteToken } from '@/lib/data/projects'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'
import { verifyTesterSession } from '@/lib/tester/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_tester_session')?.value
  const session = sessionCookie ? verifyTesterSession(sessionCookie) : null
  if (!session || session.projectToken !== token) {
    return NextResponse.json({ error: 'Not joined.' }, { status: 401 })
  }

  const project = await findProjectByInviteToken(token)
  if (!project || !project.inviteActive) {
    return NextResponse.json({ error: 'This UAT link is no longer active.' }, { status: 410 })
  }

  const testCaseMetas = await listTestCases(project.id)
  const testCases = await Promise.all(
    testCaseMetas.map(async (tc) => {
      const result = await getResult(session.runId, tc.id)
      return { id: tc.id, title: tc.title, status: result?.status ?? 'not_started' }
    })
  )

  return NextResponse.json({
    projectName: project.name,
    testerName: session.testerName,
    testCases,
  })
}
