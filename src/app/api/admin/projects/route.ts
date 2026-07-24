import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/session'
import { listProjects, createProject } from '@/lib/data/projects'
import { listInvites } from '@/lib/data/invites'
import { listTestCases } from '@/lib/data/testCases'
import { getResult } from '@/lib/data/results'
import { countByStatus } from '@/lib/aggregate'

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await listProjects()
  const projectSummaries = await Promise.all(
    projects.map(async (p) => {
      const [testCases, invites] = await Promise.all([listTestCases(p.id), listInvites(p.id)])
      const claimedInvites = invites.filter((i) => i.claimedAt)
      const results = (
        await Promise.all(testCases.flatMap((tc) => claimedInvites.map((invite) => getResult(invite.token, tc.id))))
      ).filter((r): r is NonNullable<typeof r> => r !== null)
      const counts = countByStatus(results)
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        inviteCount: invites.length,
        claimedInviteCount: claimedInvites.length,
        counts,
      }
    })
  )

  const totalFailures = projectSummaries.reduce((sum, p) => sum + p.counts.failed, 0)

  return NextResponse.json({
    projects: projectSummaries,
    summary: { activeProjects: projectSummaries.length, totalFailures },
  })
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Project name is required.' }, { status: 400 })

  const project = await createProject({ name, description: body.description ?? null })
  return NextResponse.json({ project }, { status: 201 })
}
