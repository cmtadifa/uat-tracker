'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'

interface TestCaseDetail {
  id: string
  title: string
  steps: string[]
  expectedResult: string
  status: string
  failReason: string | null
}

export default function TestCaseDetailPage() {
  const params = useParams<{ token: string; testCaseId: string }>()
  const router = useRouter()
  const [testCase, setTestCase] = useState<TestCaseDetail | null>(null)
  const [failReason, setFailReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)

  useEffect(() => {
    fetch(`/api/tester/test-case/${params.testCaseId}`).then(async (res) => {
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setTestCase(data)
      setFailReason(data.failReason ?? '')
    })
  }, [params.testCaseId])

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
    router.push(`/uat/${params.token}/checklist`)
  }

  if (error && !testCase) return <Container className="text-muted-foreground">{error}</Container>
  if (!testCase) return <Container className="text-muted-foreground">Loading…</Container>

  return (
    <Container>
      <h1 className="mb-3 text-xl font-semibold">{testCase.title}</h1>
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

      <div className="mb-4 flex gap-2">
        <Button variant="success" onClick={() => submit('passed')} disabled={submitting}>
          Pass
        </Button>
      </div>

      <Card>
        <label className="mb-2 block font-medium">Fail with a reason</label>
        <Textarea
          value={failReason}
          onChange={(e) => setFailReason(e.target.value)}
          rows={3}
          placeholder="What went wrong?"
          className="mb-3"
        />
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
        <Button variant="danger" onClick={() => submit('failed')} disabled={submitting}>
          Fail
        </Button>
      </Card>

      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Container>
  )
}
