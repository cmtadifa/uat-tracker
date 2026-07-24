'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Project, TestCaseMeta, Result } from '@/lib/types'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'
import StatusBadge from '@/components/ui/Badge'

interface TestCaseWithResult extends TestCaseMeta {
  result: Result
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

  if (!project) return <Container className="text-muted-foreground">Loading…</Container>

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/uat/${project.inviteToken}` : ''

  return (
    <Container size="lg">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      {project.description && <p className="mt-1 mb-4 text-muted-foreground">{project.description}</p>}

      <Card className="mb-6">
        <h2 className="mb-2 font-medium">Invite Link</h2>
        {project.inviteActive ? (
          <p className="mb-3 break-all rounded-lg bg-muted px-3 py-2 text-sm">{inviteUrl}</p>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">Link revoked</p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => inviteAction('regenerate')}>
            Regenerate
          </Button>
          {project.inviteActive ? (
            <Button variant="secondary" onClick={() => inviteAction('revoke')}>
              Revoke
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => inviteAction('reactivate')}>
              Reactivate
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-medium">Add Test Case</h2>
        <form onSubmit={createTestCase} className="mb-5 flex flex-col gap-2">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" required />
          <Textarea
            value={newSteps}
            onChange={(e) => setNewSteps(e.target.value)}
            placeholder="Steps, one per line"
            rows={3}
          />
          <Textarea
            value={newExpected}
            onChange={(e) => setNewExpected(e.target.value)}
            placeholder="Expected result"
            required
            rows={2}
          />
          <Button type="submit" className="self-start">
            Add Test Case
          </Button>
        </form>
        {tcError && (
          <div className="mb-4">
            <ErrorText>{tcError}</ErrorText>
          </div>
        )}

        <h2 className="mb-3 font-medium">Test Cases ({testCases.length})</h2>
        <ul className="flex flex-col gap-3">
          {testCases.map((tc, index) => (
            <li key={tc.id} className="rounded-lg border border-border p-4">
              {editingId === tc.id ? (
                <div className="flex flex-col gap-2">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  <Textarea value={editSteps} onChange={(e) => setEditSteps(e.target.value)} rows={3} />
                  <Textarea value={editExpected} onChange={(e) => setEditExpected(e.target.value)} required rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={() => saveEdit(tc.id)}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium">{tc.title}</p>
                  <ol className="list-inside list-decimal text-sm text-muted-foreground">
                    {tc.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">Expected:</span> {tc.expectedResult}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge status={tc.result.status} />
                    {tc.result.testerName && (
                      <span className="text-xs text-muted-foreground">
                        by {tc.result.testerName} · {new Date(tc.result.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {tc.result.status === 'failed' && tc.result.failReason && (
                    <p className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                      Reason: {tc.result.failReason}
                    </p>
                  )}
                  {tc.result.screenshots.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tc.result.screenshots.map((s) => (
                        <a key={s.id} href={`/api/admin/screenshots/${s.storagePath}`} target="_blank" rel="noreferrer">
                          <img
                            src={`/api/admin/screenshots/${s.storagePath}`}
                            alt="Evidence screenshot"
                            className="h-16 w-16 rounded-lg border border-border object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" className="px-2.5" onClick={() => moveTestCase(index, 'up')}>
                      ↑
                    </Button>
                    <Button variant="ghost" className="px-2.5" onClick={() => moveTestCase(index, 'down')}>
                      ↓
                    </Button>
                    <Button variant="secondary" onClick={() => startEdit(tc)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => deleteTestCase(tc.id)}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </Container>
  )
}
