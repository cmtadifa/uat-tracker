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
        fetch(`/api/tester/test-case/${params.testCaseId}`),
        fetch(`/api/tester/checklist/${params.token}`),
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
        setChecklist(listData.testCases)
        setProjectName(listData.projectName)
        setTesterName(listData.testerName)
      }
    }
    load()
  }, [params.testCaseId, params.token])

  const currentIndex = checklist.findIndex((i) => i.id === params.testCaseId)
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

    setSubmitting(false)
    goNext()
  }

  if (error && !testCase) return <Container className="text-muted-foreground">{error}</Container>
  if (!testCase) return <Container className="text-muted-foreground">Loading…</Container>

  return (
    <Container>
      {projectName && <TesterHeader projectName={projectName} testerName={testerName} />}

      {checklist.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <Link href={`/uat/${params.token}/checklist`} className="text-accent hover:underline">
              ← Back to checklist
            </Link>
            {currentIndex >= 0 && (
              <span className="text-muted-foreground">
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
      <Card className="mb-4">
        <ol className="list-inside list-decimal">
          {testCase.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm">
          <span className="font-medium">Expected result:</span> {testCase.expectedResult}
        </p>
      </Card>

      <p className="mb-3 text-sm text-muted-foreground">
        Follow the steps above. Does the app behave as expected? Mark it Passed, or Failed if it doesn&apos;t. You
        can also skip and come back to it later.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="success" onClick={() => submit('passed')} disabled={submitting}>
          Pass
        </Button>
        {!showFailForm && (
          <Button variant="danger" onClick={() => setShowFailForm(true)} disabled={submitting}>
            Fail
          </Button>
        )}
        <button
          onClick={goNext}
          disabled={submitting}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Skip for now →
        </button>
      </div>

      {showFailForm && (
        <Card>
          <label className="mb-2 block font-medium">Fail with a reason</label>
          <p className="mb-2 text-sm text-muted-foreground">Describe what went wrong so the team can reproduce it.</p>
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
  )
}
