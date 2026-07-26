'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import TesterHeader from '@/components/TesterHeader'
import { getLocalOverrides } from '@/lib/tester/localOverrides'

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
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function load() {
      fetch(`/api/tester/checklist/${params.token}`, { cache: 'no-store' }).then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error)
          return
        }
        const overrides = getLocalOverrides(params.token)
        const merged: ChecklistItem[] = data.testCases.map((item: ChecklistItem) => ({
          ...item,
          status: overrides[item.id] ?? item.status,
        }))
        setProjectName(data.projectName)
        setTesterName(data.testerName)
        setItems(merged)
        setLoaded(true)
      })
    }
    load()
    function onVisible() {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', load)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', load)
    }
  }, [params.token])

  if (error) return <Container className="text-muted-foreground">{error}</Container>
  if (!loaded) return <Container className="text-muted-foreground">Loading…</Container>

  const passed = items.filter((i) => i.status === 'passed').length
  const failed = items.filter((i) => i.status === 'failed').length
  const total = items.length
  const completed = passed + failed
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const allDone = total > 0 && completed === total

  return (
    <Container>
      <TesterHeader projectName={projectName} testerName={testerName} />

      {allDone && (
        <Card className="mb-6 border-success/30 bg-success-bg text-center">
          <p className="text-lg font-semibold text-success">🎉 Thank you for your responses!</p>
          <p className="mt-1 text-sm text-success">
            You&apos;ve gone through all {total} test case{total === 1 ? '' : 's'}. You can still open any item
            below to review or change your answer.
          </p>
        </Card>
      )}

      {total > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              {completed} of {total} complete
            </span>
            <span className="text-muted-foreground">
              {passed} passed · {failed} failed
            </span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      )}

      {total === 0 ? (
        <Card className="text-center text-muted-foreground">
          No test cases have been added to this project yet. Check back once the admin has set some up.
        </Card>
      ) : (
        <>
          {!allDone && (
            <p className="mb-3 text-sm text-muted-foreground">
              Tap any item below to see its steps and mark it Passed or Failed.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/uat/${params.token}/test-case/${item.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {item.title}
                </Link>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Container>
  )
}
