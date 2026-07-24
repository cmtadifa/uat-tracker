'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ScreenshotDto { id: string; storagePath: string; uploadedAt: string }
interface TestCaseDto {
  id: string
  title: string
  steps: string[]
  expectedResult: string
  orderIndex: number
  result: {
    id: string
    status: string
    testerName: string | null
    failReason: string | null
    updatedAt: string
    screenshots: ScreenshotDto[]
  }
}
interface ProjectDetail {
  id: string
  name: string
  description: string | null
  inviteToken: string
  inviteActive: boolean
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [testCases, setTestCases] = useState<TestCaseDto[]>([])

  async function load() {
    const res = await fetch(`/api/admin/projects/${params.projectId}`)
    const data = await res.json()
    if (!res.ok) return
    setProject({
      id: data.project.id,
      name: data.project.name,
      description: data.project.description,
      inviteToken: data.project.invite_token,
      inviteActive: data.project.invite_active,
    })
    setTestCases(
      (data.testCases ?? []).map((tc: any) => ({
        id: tc.id,
        title: tc.title,
        steps: tc.steps,
        expectedResult: tc.expected_result,
        orderIndex: tc.order_index,
        result: {
          id: tc.results.id,
          status: tc.results.status,
          testerName: tc.results.tester_name,
          failReason: tc.results.fail_reason,
          updatedAt: tc.results.updated_at,
          screenshots: (tc.results.screenshots ?? []).map((s: any) => ({
            id: s.id,
            storagePath: s.storage_path,
            uploadedAt: s.uploaded_at,
          })),
        },
      }))
    )
  }

  useEffect(() => {
    load()
  }, [params.projectId])

  async function inviteAction(action: 'regenerate' | 'revoke' | 'reactivate') {
    await fetch(`/api/admin/projects/${params.projectId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    load()
  }

  if (!project) return <main className="p-8">Loading…</main>

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/uat/${project.inviteToken}` : ''

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold mb-2">{project.name}</h1>
      {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}

      <section className="border rounded p-4 mb-6">
        <h2 className="font-medium mb-2">Invite Link</h2>
        {project.inviteActive ? (
          <p className="break-all text-sm mb-2">{inviteUrl}</p>
        ) : (
          <p className="text-sm text-gray-500 mb-2">Link revoked</p>
        )}
        <div className="flex gap-2">
          <button onClick={() => inviteAction('regenerate')} className="border rounded px-3 py-1">
            Regenerate
          </button>
          {project.inviteActive ? (
            <button onClick={() => inviteAction('revoke')} className="border rounded px-3 py-1">
              Revoke
            </button>
          ) : (
            <button onClick={() => inviteAction('reactivate')} className="border rounded px-3 py-1">
              Reactivate
            </button>
          )}
        </div>
      </section>

      <section className="border rounded p-4">
        <h2 className="font-medium mb-2">Test Cases ({testCases.length})</h2>
        <p className="text-sm text-gray-500">Test case authoring added in Task 10.</p>
      </section>
    </main>
  )
}
