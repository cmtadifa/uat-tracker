import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { findProjectByInviteToken } from '@/lib/data/projects'
import { listTestCases } from '@/lib/data/testCases'
import { verifyTesterSession } from '@/lib/tester/session'
import JoinForm from './JoinForm'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const project = await findProjectByInviteToken(token)

  if (!project || !project.inviteActive) {
    redirect(`/uat/${token}/invalid`)
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_tester_session')?.value
  const session = sessionCookie ? verifyTesterSession(sessionCookie) : null
  if (session && session.projectToken === token) {
    redirect(`/uat/${token}/checklist`)
  }

  const testCases = await listTestCases(project.id)

  return (
    <JoinForm
      token={token}
      projectName={project.name}
      projectDescription={project.description}
      testCaseCount={testCases.length}
    />
  )
}
