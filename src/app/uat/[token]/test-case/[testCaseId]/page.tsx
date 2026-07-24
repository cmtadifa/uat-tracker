'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    router.push(`/uat/${params.token}/checklist`)
  }

  if (error && !testCase) return <main className="p-8">{error}</main>
  if (!testCase) return <main className="p-8">Loading…</main>

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold mb-2">{testCase.title}</h1>
      <ol className="list-decimal list-inside mb-4">
        {testCase.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p className="mb-4">
        <span className="font-medium">Expected result:</span> {testCase.expectedResult}
      </p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => submit('passed')} disabled={submitting} className="bg-green-600 text-white rounded px-4 py-2">
          Pass
        </button>
      </div>

      <div className="border rounded p-4">
        <label className="block mb-2 font-medium">Fail with a reason</label>
        <textarea
          value={failReason}
          onChange={(e) => setFailReason(e.target.value)}
          rows={3}
          placeholder="What went wrong?"
          className="border rounded p-2 w-full mb-2"
        />
        <button onClick={() => submit('failed')} disabled={submitting} className="bg-red-600 text-white rounded px-4 py-2">
          Fail
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </main>
  )
}
