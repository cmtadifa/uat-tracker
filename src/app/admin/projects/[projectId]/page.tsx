'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Project, TestCaseMeta, Result, Run } from '@/lib/types'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'
import StatusBadge from '@/components/ui/Badge'

interface TestCaseWithResults extends TestCaseMeta {
  results: { run: Run; result: Result }[]
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [testCases, setTestCases] = useState<TestCaseWithResults[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newSteps, setNewSteps] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [tcError, setTcError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSteps, setEditSteps] = useState('')
  const [editExpected, setEditExpected] = useState('')
  const [suggestionDrafts, setSuggestionDrafts] = useState<Record<string, string>>({})
  const [savingSuggestion, setSavingSuggestion] = useState<string | null>(null)

  async function load() {
    const res = await fetch(`/api/admin/projects/${params.projectId}`)
    const data = await res.json()
    if (!res.ok) return
    setProject(data.project)
    setRuns(data.runs)
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

  function startEdit(tc: TestCaseWithResults) {
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

  async function saveSuggestion(tcId: string) {
    const tc = testCases.find((t) => t.id === tcId)
    const value = suggestionDrafts[tcId] ?? tc?.suggestion ?? ''
    setSavingSuggestion(tcId)
    await fetch(`/api/admin/projects/${params.projectId}/test-cases/${tcId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion: value }),
    })
    setSavingSuggestion(null)
    load()
  }

  function exportResults() {
    window.location.href = `/api/admin/projects/${params.projectId}/export`
  }

  if (!project) return <Container className="text-muted-foreground">Loading…</Container>

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/uat/${project.inviteToken}` : ''

  return (
    <Container size="xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && <p className="mt-1 text-muted-foreground">{project.description}</p>}
        </div>
        <Button variant="secondary" onClick={exportResults}>
          ⬇ Export Results (CSV)
        </Button>
      </div>

      <Card className="mb-6">
        <h2 className="mb-2 font-medium">Invite Link</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Share this one link with the whole team — anyone who opens it and enters their name gets their own
          independent checklist.
        </p>
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

        <div className="mt-4 border-t border-border pt-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {runs.length === 0 ? 'No testers yet' : `${runs.length} tester${runs.length === 1 ? '' : 's'} joined`}
          </h3>
          {runs.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {runs.map((run) => (
                <li key={run.id} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {run.testerName} · {new Date(run.startedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-2 font-medium">Add Test Case</h2>
        <form onSubmit={createTestCase} className="flex flex-col gap-2">
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
          <div className="mt-4">
            <ErrorText>{tcError}</ErrorText>
          </div>
        )}
      </Card>

      <h2 className="mb-3 font-medium">Test Cases ({testCases.length})</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {testCases.map((tc, index) => (
          <Card key={tc.id} className="h-fit">
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

                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {tc.results.length === 0
                      ? 'No testers yet'
                      : `${tc.results.length} tester${tc.results.length === 1 ? '' : 's'}`}
                  </p>
                  {tc.results.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No one has joined and tested this yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {tc.results.map(({ run, result }) => (
                        <li key={run.id} className="rounded-lg bg-muted p-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={result.status} />
                            <span className="text-xs text-muted-foreground">
                              {run.testerName} · {new Date(result.updatedAt).toLocaleString()}
                            </span>
                          </div>
                          {result.status === 'failed' && result.failReason && (
                            <p className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                              Reason: {result.failReason}
                            </p>
                          )}
                          {result.screenshots.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {result.screenshots.map((s) => (
                                <a
                                  key={s.id}
                                  href={`/api/admin/screenshots/${s.storagePath}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={`/api/admin/screenshots/${s.storagePath}`}
                                    alt="Evidence screenshot"
                                    className="h-16 w-16 rounded-lg border border-border object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Suggested fix / improvement
                  </label>
                  <Textarea
                    value={suggestionDrafts[tc.id] ?? tc.suggestion ?? ''}
                    onChange={(e) => setSuggestionDrafts((prev) => ({ ...prev, [tc.id]: e.target.value }))}
                    placeholder="Optional note for the team, included in the exported report"
                    rows={2}
                    className="mb-2"
                  />
                  <Button variant="secondary" onClick={() => saveSuggestion(tc.id)} disabled={savingSuggestion === tc.id}>
                    {savingSuggestion === tc.id ? 'Saving…' : 'Save Suggestion'}
                  </Button>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <div className="inline-flex overflow-hidden rounded-lg border border-border">
                    <button
                      onClick={() => moveTestCase(index, 'up')}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="px-2.5 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveTestCase(index, 'down')}
                      disabled={index === testCases.length - 1}
                      aria-label="Move down"
                      className="border-l border-border px-2.5 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                  <Button variant="secondary" onClick={() => startEdit(tc)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => deleteTestCase(tc.id)}>
                    Delete
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </Container>
  )
}
