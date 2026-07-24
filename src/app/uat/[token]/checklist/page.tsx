'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ChecklistItem {
  id: string
  title: string
  status: string
}

function statusLabel(status: string) {
  if (status === 'passed') return 'Passed'
  if (status === 'failed') return 'Failed'
  return 'Not Started'
}

export default function ChecklistPage() {
  const params = useParams<{ token: string }>()
  const [projectName, setProjectName] = useState('')
  const [testerName, setTesterName] = useState('')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/tester/checklist/${params.token}`).then(async (res) => {
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setProjectName(data.projectName)
      setTesterName(data.testerName)
      setItems(data.testCases)
    })
  }, [params.token])

  if (error) return <main className="p-8">{error}</main>

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold mb-1">{projectName}</h1>
      <p className="text-gray-600 mb-4">Testing as {testerName}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="border rounded p-3 flex justify-between items-center">
            <Link href={`/uat/${params.token}/test-case/${item.id}`} className="underline">
              {item.title}
            </Link>
            <span className="text-xs text-gray-500">{statusLabel(item.status)}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
