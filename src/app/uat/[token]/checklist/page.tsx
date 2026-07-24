'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Container from '@/components/ui/Container'
import StatusBadge from '@/components/ui/Badge'

interface ChecklistItem {
  id: string
  title: string
  status: string
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

  if (error) return <Container className="text-muted-foreground">{error}</Container>

  return (
    <Container>
      <h1 className="text-xl font-semibold">{projectName}</h1>
      <p className="mt-1 mb-5 text-muted-foreground">Testing as {testerName}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href={`/uat/${params.token}/test-case/${item.id}`} className="font-medium text-accent hover:underline">
              {item.title}
            </Link>
            <StatusBadge status={item.status} />
          </li>
        ))}
      </ul>
    </Container>
  )
}
