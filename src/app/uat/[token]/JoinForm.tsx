'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'
import StepProgress from '@/components/StepProgress'

export default function JoinForm({
  token,
  projectName,
  projectDescription,
  testCaseCount,
}: {
  token: string
  projectName: string
  projectDescription: string | null
  testCaseCount: number
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/tester/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, role }),
    })
    let data: { error?: string } = {}
    try {
      data = await res.json()
    } catch {
      if (!res.ok) {
        setSubmitting(false)
        setError('Something went wrong. Please try again.')
        return
      }
    }
    if (!res.ok) {
      setSubmitting(false)
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    // Skip the checklist hub on entry -- go straight into the first question.
    // The checklist remains reachable via "Back to checklist" and is where the
    // tester lands again once every question has been answered.
    try {
      const listRes = await fetch(`/api/tester/checklist/${token}`, { cache: 'no-store' })
      if (listRes.ok) {
        const listData = await listRes.json()
        const first = listData.testCases?.[0]
        if (first) {
          router.push(`/uat/${token}/test-case/${first.id}`)
          return
        }
      }
    } catch {
      // fall through to the checklist below
    }
    router.push(`/uat/${token}/checklist`)
  }

  return (
    <>
      <StepProgress step={1} total={testCaseCount + 1} />
      <Container size="sm" className="flex flex-1 flex-col items-center justify-center">
        <Card className="w-full">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">Before you start</p>
          <h1 className="mb-2 text-xl font-semibold">{projectName}</h1>

          {projectDescription && (
            <p className="mb-3 whitespace-pre-line text-sm text-muted-foreground">{projectDescription}</p>
          )}

          <div className="mb-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {testCaseCount} test case{testCaseCount === 1 ? '' : 's'} to review
            </span>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Your name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jamie Cruz" required autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Your role (optional)</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. QA Engineer" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll be given each item one at a time. Follow the steps, then mark it{' '}
              <span className="font-medium text-success">Passed</span> or{' '}
              <span className="font-medium text-danger">Failed</span> — if something&apos;s wrong, explain what
              happened and attach screenshots. No account needed.
            </p>
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? 'Starting…' : 'Start Testing'}
            </Button>
          </form>
          {error && (
            <div className="mt-4">
              <ErrorText>{error}</ErrorText>
            </div>
          )}
        </Card>
      </Container>
    </>
  )
}
