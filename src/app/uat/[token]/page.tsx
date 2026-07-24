import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { findInviteByToken } from '@/lib/data/invites'
import { listTestCases } from '@/lib/data/testCases'
import { verifyTesterSession } from '@/lib/tester/session'
import JoinForm from './JoinForm'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const found = await findInviteByToken(token)

  if (!found || !found.invite.active) {
    redirect(`/uat/${token}/invalid`)
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_tester_session')?.value
  const session = sessionCookie ? verifyTesterSession(sessionCookie) : null
  if (session && session.projectToken === token) {
    redirect(`/uat/${token}/checklist`)
  }

  if (found.invite.claimedAt) {
    redirect(`/uat/${token}/invalid`)
  }

  const testCases = await listTestCases(found.project.id)

  return (
    <JoinForm
      token={token}
      projectName={found.project.name}
      projectDescription={found.project.description}
      testCaseCount={testCases.length}
    />
  )
}
