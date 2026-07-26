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
      body: JSON.stringify({ token, name }),
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
    router.push(`/uat/${token}/checklist`)
  }

  return (
    <>
      <StepProgress step={1} total={testCaseCount + 1} />
      <Container size="sm" className="flex flex-1 flex-col items-center justify-center">
        <Card className="w-full">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">Before you start</p>
          <h1 className="mb-2 text-xl font-semibold">{projectName}</h1>

          {projectDescription && <p className="mb-3 text-sm text-muted-foreground">{projectDescription}</p>}

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {testCaseCount} test case{testCaseCount === 1 ? '' : 's'} to review
            </span>
          </div>

          <p className="mb-5 text-sm text-muted-foreground">
            You&apos;ll be given each item one at a time. Follow the steps, then mark it{' '}
            <span className="font-medium text-success">Passed</span> or{' '}
            <span className="font-medium text-danger">Failed</span> — if something&apos;s wrong, you can explain what
            happened and attach screenshots. Enter your name to get started, no account needed.
          </p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoFocus />
            <Button type="submit" disabled={submitting}>
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
