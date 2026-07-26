'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'
import TesterHeader from '@/components/TesterHeader'
import StepProgress from '@/components/StepProgress'
import { getLocalOverrides, setLocalOverride } from '@/lib/tester/localOverrides'

interface TestCaseDetail {
  id: string
  title: string
  steps: string[]
  expectedResult: string
  status: string
  failReason: string | null
}

interface ChecklistItem {
  id: string
  title: string
  status: string
}

const OUTLINE_BASE =
  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export default function TestCaseDetailPage() {
  const params = useParams<{ token: string; testCaseId: string }>()
  const router = useRouter()
  const [testCase, setTestCase] = useState<TestCaseDetail | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [projectName, setProjectName] = useState('')
  const [testerName, setTesterName] = useState('')
  const [failReason, setFailReason] = useState('')
  const [showFailForm, setShowFailForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)

  useEffect(() => {
    async function load() {
      const [tcRes, listRes] = await Promise.all([
        fetch(`/api/tester/test-case/${params.testCaseId}`, { cache: 'no-store' }),
        fetch(`/api/tester/checklist/${params.token}`, { cache: 'no-store' }),
      ])
      const tcData = await tcRes.json()
      if (!tcRes.ok) {
        setError(tcData.error)
        return
      }
      setTestCase(tcData)
      setFailReason(tcData.failReason ?? '')
      setShowFailForm(false)
      setFiles(null)
      if (listRes.ok) {
        const listData = await listRes.json()
        const overrides = getLocalOverrides(params.token)
        const merged: ChecklistItem[] = listData.testCases.map((item: ChecklistItem) => ({
          ...item,
          status: overrides[item.id] ?? item.status,
        }))
        setChecklist(merged)
        setProjectName(listData.projectName)
        setTesterName(listData.testerName)
      }
    }
    load()
  }, [params.testCaseId, params.token])

  const currentIndex = checklist.findIndex((i) => i.id === params.testCaseId)
  const prevItem = currentIndex > 0 ? checklist[currentIndex - 1] : undefined
  const nextItem = currentIndex >= 0 ? checklist[currentIndex + 1] : undefined

  function goNext() {
    if (nextItem) {
      router.push(`/uat/${params.token}/test-case/${nextItem.id}`)
    } else {
      router.push(`/uat/${params.token}/checklist`)
    }
  }

  async function submit(status: 'passed' | 'failed') {
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/tester/test-case/${params.testCaseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, failReason: status === 'failed' ? failReason : null }),
    })
    const data = await res.json()
    if (!res.ok) {
      setSubmitting(false)
      setError(data.error)
      return
    }

    if (status === 'failed' && files && files.length > 0) {
      const form = new FormData()
      form.append('testCaseId', params.testCaseId)
      Array.from(files).forEach((file) => form.append('files', file))
      const uploadRes = await fetch('/api/tester/upload', { method: 'POST', body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        setSubmitting(false)
        setError(uploadData.error)
        return
      }
    }

    // The Blobs store doesn't guarantee this write is visible to the very
    // next read (e.g. on the next question's page). Record it locally so
    // our own stepper/checklist trust what we just submitted immediately,
    // rather than waiting for the store to catch up.
    setLocalOverride(params.token, params.testCaseId, status)

    setSubmitting(false)
    goNext()
  }

  if (error && !testCase) return <Container className="text-muted-foreground">{error}</Container>
  if (!testCase) return <Container className="text-muted-foreground">Loading…</Container>

  return (
    <>
      {checklist.length > 0 && currentIndex >= 0 && (
        <StepProgress step={currentIndex + 2} total={checklist.length + 1} />
      )}
      <Container>
        {projectName && <TesterHeader projectName={projectName} testerName={testerName} />}

        {checklist.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Link href={`/uat/${params.token}/checklist`} className="text-sm text-accent hover:underline">
                ← Back to checklist
              </Link>
              {currentIndex >= 0 && (
                <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  Question {currentIndex + 1} of {checklist.length}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {checklist.map((item, i) => {
                const isCurrent = item.id === params.testCaseId
                const dotColor =
                  item.status === 'passed' ? 'bg-success' : item.status === 'failed' ? 'bg-danger' : 'bg-muted'
                return (
                  <Link
                    key={item.id}
                    href={`/uat/${params.token}/test-case/${item.id}`}
                    title={`${i + 1}. ${item.title}`}
                    className={`h-2 flex-1 rounded-full ${dotColor} ${
                      isCurrent ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                    }`}
                  />
                )
              })}
            </div>
          </div>
        )}

        <h2 className="mb-3 text-xl font-semibold">{testCase.title}</h2>

        <div className="mb-3 rounded-xl border border-accent/25 bg-accent/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Steps</p>
          <ol className="list-inside list-decimal">
            {testCase.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-muted p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected Result</p>
          <p className="text-sm">{testCase.expectedResult}</p>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Follow the steps above. Does the app behave as expected? Mark it Passed, or Failed if it doesn&apos;t. You
          can also skip and come back to it later.
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => submit('passed')}
            disabled={submitting}
            className={`${OUTLINE_BASE} border-success/40 bg-card text-success hover:bg-success-bg`}
          >
            <span aria-hidden>✓</span> Pass
          </button>
          <button
            onClick={() => setShowFailForm(true)}
            disabled={submitting}
            className={`${OUTLINE_BASE} border-danger/40 bg-card text-danger hover:bg-danger-bg`}
          >
            <span aria-hidden>✗</span> Fail
          </button>
          <button
            onClick={goNext}
            disabled={submitting}
            className={`${OUTLINE_BASE} border-border bg-card text-muted-foreground hover:bg-muted`}
          >
            <span aria-hidden>↷</span> Skip
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          {prevItem ? (
            <Link
              href={`/uat/${params.token}/test-case/${prevItem.id}`}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
        </div>

        {showFailForm && (
          <Card>
            <label className="mb-2 block font-medium">Fail with a reason</label>
            <p className="mb-2 text-sm text-muted-foreground">
              Describe what went wrong so the team can reproduce it.
            </p>
            <Textarea
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              rows={3}
              placeholder="What went wrong?"
              className="mb-3"
              autoFocus
            />
            <label className="mb-1 block text-sm font-medium">Screenshots (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="mb-3 block text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-border"
            />
            {files && files.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {Array.from(files).map((file, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(file)}
                    alt={`Selected screenshot ${i + 1}`}
                    className="h-16 w-16 rounded-lg border border-border object-cover"
                  />
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => submit('failed')} disabled={submitting}>
                Submit Fail
              </Button>
              <Button variant="ghost" onClick={() => setShowFailForm(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {error && (
          <div className="mt-4">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </Container>
    </>
  )
}
