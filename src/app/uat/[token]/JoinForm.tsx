'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'

export default function JoinForm({ token, projectName }: { token: string; projectName: string }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
        setError('Something went wrong. Please try again.')
        return
      }
    }
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }
    router.push(`/uat/${token}/checklist`)
  }

  return (
    <Container size="sm" className="flex flex-1 flex-col items-center justify-center">
      <Card className="w-full">
        <h1 className="mb-1 text-xl font-semibold">{projectName}</h1>
        <p className="mb-5 text-sm text-muted-foreground">Enter your name to start testing.</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoFocus />
          <Button type="submit">Start Testing</Button>
        </form>
        {error && (
          <div className="mt-4">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </Card>
    </Container>
  )
}
