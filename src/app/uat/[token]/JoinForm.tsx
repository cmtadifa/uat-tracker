'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    router.push(`/uat/${token}/checklist`)
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-semibold mb-2">{projectName}</h1>
      <p className="text-gray-600 mb-4">Enter your name to start testing.</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="border rounded p-2"
        />
        <button type="submit" className="bg-black text-white rounded p-2">
          Start Testing
        </button>
      </form>
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </main>
  )
}
