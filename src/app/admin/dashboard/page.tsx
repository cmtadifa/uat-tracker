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

const TILE_STYLES = ['bg-accent/15 text-accent', 'bg-success-bg text-success', 'bg-danger-bg text-danger', 'bg-muted text-muted-foreground']

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
    <Container size="xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">UAT Projects</h1>
        <p className="mt-2 text-muted-foreground">
          {summary.activeProjects} UAT round{summary.activeProjects === 1 ? '' : 's'} active · {summary.totalFailures}{' '}
          failure{summary.totalFailures === 1 ? '' : 's'} across all of them
        </p>
      </div>

      <Card className="mb-8">
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

      {projects.length === 0 ? (
        <Card className="text-center text-muted-foreground">No UAT projects yet. Create one above to get started.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="group block h-full">
              <Card className="flex h-full items-start gap-4 transition-shadow hover:shadow-md">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${TILE_STYLES[i % TILE_STYLES.length]}`}
                >
                  📋
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    <span className="mt-0.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.counts.passed} passed · {p.counts.failed} failed · {p.counts.notStarted} not started
                  </p>
                  {!p.inviteActive && (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">Invite revoked</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  )
}
