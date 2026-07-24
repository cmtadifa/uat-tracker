'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'

interface ProjectSummary {
  id: string
  name: string
  description: string | null
  inviteToken: string
  inviteActive: boolean
  createdAt: string
  counts: { notStarted: number; passed: number; failed: number; total: number }
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [summary, setSummary] = useState({ activeProjects: 0, totalFailures: 0 })
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/projects')
    const data = await res.json()
    if (res.ok) {
      setProjects(data.projects)
      setSummary(data.summary)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setNewName('')
    load()
  }

  return (
    <Container size="lg">
      <h1 className="text-2xl font-semibold">UAT Projects</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        {summary.activeProjects} UAT round{summary.activeProjects === 1 ? '' : 's'} active · {summary.totalFailures} failure
        {summary.totalFailures === 1 ? '' : 's'} across all of them
      </p>

      <Card className="mb-6">
        <form onSubmit={createProject} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New UAT project name"
            required
            className="flex-1"
          />
          <Button type="submit">Create</Button>
        </form>
        {error && (
          <div className="mt-3">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </Card>

      <ul className="flex flex-col gap-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Card className="transition-shadow hover:shadow-md">
              <Link href={`/admin/projects/${p.id}`} className="font-medium text-accent hover:underline">
                {p.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.counts.passed} passed · {p.counts.failed} failed · {p.counts.notStarted} not started
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  )
}
