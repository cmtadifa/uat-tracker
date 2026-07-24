'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Project, TestCaseMeta, Result } from '@/lib/types'

interface TestCaseWithResult extends TestCaseMeta {
  result: Result
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    not_started: 'bg-gray-200 text-gray-700',
    passed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = { not_started: 'Not Started', passed: 'Passed', failed: 'Failed' }
  return <span className={`text-xs rounded px-2 py-1 ${styles[status]}`}>{labels[status]}</span>
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [testCases, setTestCases] = useState<TestCaseWithResult[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newSteps, setNewSteps] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [tcError, setTcError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSteps, setEditSteps] = useState('')
  const [editExpected, setEditExpected] = useState('')

  async function load() {
    const res = await fetch(`/api/admin/projects/${params.projectId}`)
    const data = await res.json()
    if (!res.ok) return
    setProject(data.project)
    setTestCases(data.testCases)
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

  async function createTestCase(e: React.FormEvent) {
    e.preventDefault()
    setTcError(null)
    const res = await fetch(`/api/admin/projects/${params.projectId}/test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, steps: newSteps.split('\n'), expectedResult: newExpected }),
    })
    const data = await res.json()
    if (!res.ok) {
      setTcError(data.error)
      return
    }
    setNewTitle('')
    setNewSteps('')
    setNewExpected('')
    load()
  }

  async function deleteTestCase(id: string) {
    const res = await fetch(`/api/admin/projects/${params.projectId}/test-cases/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setTcError('Failed to delete test case.')
      return
    }
    load()
  }

  function startEdit(tc: TestCaseWithResult) {
    setEditingId(tc.id)
    setEditTitle(tc.title)
    setEditSteps(tc.steps.join('\n'))
    setEditExpected(tc.expectedResult)
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/projects/${params.projectId}/test-cases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, steps: editSteps.split('\n'), expectedResult: editExpected }),
    })
    if (!res.ok) {
      setTcError('Failed to save test case.')
      return
    }
    setEditingId(null)
    load()
  }

  async function moveTestCase(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= testCases.length) return
    const a = testCases[index]
    const b = testCases[swapIndex]
    const resA = await fetch(`/api/admin/projects/${params.projectId}/test-cases/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIndex: b.orderIndex }),
    })
    if (!resA.ok) {
      setTcError('Failed to reorder test case.')
      return
    }
    const resB = await fetch(`/api/admin/projects/${params.projectId}/test-cases/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIndex: a.orderIndex }),
    })
    if (!resB.ok) {
      setTcError('Failed to reorder test case.')
      return
    }
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
        <h2 className="font-medium mb-2">Add Test Case</h2>
        <form onSubmit={createTestCase} className="flex flex-col gap-2 mb-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            required
            className="border rounded p-2"
          />
          <textarea
            value={newSteps}
            onChange={(e) => setNewSteps(e.target.value)}
            placeholder="Steps, one per line"
            rows={3}
            className="border rounded p-2"
          />
          <textarea
            value={newExpected}
            onChange={(e) => setNewExpected(e.target.value)}
            placeholder="Expected result"
            required
            rows={2}
            className="border rounded p-2"
          />
          <button type="submit" className="bg-black text-white rounded p-2 self-start px-4">
            Add Test Case
          </button>
        </form>
        {tcError && <p className="text-red-600 mb-4">{tcError}</p>}

        <h2 className="font-medium mb-2">Test Cases ({testCases.length})</h2>
        <ul className="flex flex-col gap-3">
          {testCases.map((tc, index) => (
            <li key={tc.id} className="border rounded p-3">
              {editingId === tc.id ? (
                <div className="flex flex-col gap-2">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="border rounded p-2" />
                  <textarea value={editSteps} onChange={(e) => setEditSteps(e.target.value)} rows={3} className="border rounded p-2" />
                  <textarea value={editExpected} onChange={(e) => setEditExpected(e.target.value)} required rows={2} className="border rounded p-2" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(tc.id)} className="bg-black text-white rounded px-3 py-1">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="border rounded px-3 py-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium">{tc.title}</p>
                  <ol className="list-decimal list-inside text-sm text-gray-600">
                    {tc.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Expected:</span> {tc.expectedResult}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {statusBadge(tc.result.status)}
                    {tc.result.testerName && (
                      <span className="text-xs text-gray-500">
                        by {tc.result.testerName} · {new Date(tc.result.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {tc.result.status === 'failed' && tc.result.failReason && (
                    <p className="text-sm text-red-700 mt-1">Reason: {tc.result.failReason}</p>
                  )}
                  {tc.result.screenshots.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {tc.result.screenshots.map((s) => (
                        <a key={s.id} href={`/api/admin/screenshots/${s.storagePath}`} target="_blank" rel="noreferrer">
                          <img
                            src={`/api/admin/screenshots/${s.storagePath}`}
                            alt="Evidence screenshot"
                            className="h-16 w-16 object-cover rounded border"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => moveTestCase(index, 'up')} className="border rounded px-2">
                      ↑
                    </button>
                    <button onClick={() => moveTestCase(index, 'down')} className="border rounded px-2">
                      ↓
                    </button>
                    <button onClick={() => startEdit(tc)} className="border rounded px-2">
                      Edit
                    </button>
                    <button onClick={() => deleteTestCase(tc.id)} className="border rounded px-2">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
