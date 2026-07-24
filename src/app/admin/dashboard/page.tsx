'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold mb-2">UAT Projects</h1>
      <p className="text-gray-600 mb-6">
        {summary.activeProjects} UAT round{summary.activeProjects === 1 ? '' : 's'} active · {summary.totalFailures} failure{summary.totalFailures === 1 ? '' : 's'} across all of them
      </p>

      <form onSubmit={createProject} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New UAT project name"
          required
          className="border rounded p-2 flex-1"
        />
        <button type="submit" className="bg-black text-white rounded px-4">Create</button>
      </form>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <ul className="flex flex-col gap-3">
        {projects.map((p) => (
          <li key={p.id} className="border rounded p-4">
            <Link href={`/admin/projects/${p.id}`} className="font-medium underline">
              {p.name}
            </Link>
            <p className="text-sm text-gray-600">
              {p.counts.passed} passed · {p.counts.failed} failed · {p.counts.notStarted} not started
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}
