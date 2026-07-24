import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { getProjectSummary } from '@/lib/data/projects'
import { listInvites } from '@/lib/data/invites'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProjectSummary(id)
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

  const [invites, testCaseMetas] = await Promise.all([listInvites(id), listTestCases(id)])
  const claimedInvites = invites.filter((i) => i.claimedAt)

  const testCases = await Promise.all(
    testCaseMetas.map(async (tc) => {
      const results = await Promise.all(
        claimedInvites.map(async (invite) => ({
          invite,
          result: (await getResult(invite.token, tc.id)) ?? {
            id: `${invite.token}:${tc.id}`,
            testCaseId: tc.id,
            inviteToken: invite.token,
            status: 'not_started' as const,
            testerName: invite.testerName,
            failReason: null,
            updatedAt: invite.claimedAt as string,
            screenshots: [],
          },
        }))
      )
      return { ...tc, results }
    })
  )

  return NextResponse.json({ project, invites, testCases })
}
