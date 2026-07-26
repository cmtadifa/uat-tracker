import { randomUUID } from 'crypto'
import { getDataStore } from './store'
import type { Run } from '@/lib/types'

function runsKey(projectId: string): string {
  return `project:${projectId}:runs`
}

export async function listRuns(projectId: string): Promise<Run[]> {
  const store = getDataStore()
  const runs = await store.get(runsKey(projectId), { type: 'json' })
  return (runs as Run[] | null) ?? []
}

export async function createRun(projectId: string, testerName: string, testerRole: string | null): Promise<Run> {
  const store = getDataStore()
  const runs = await listRuns(projectId)
  const run: Run = {
    id: randomUUID(),
    testerName,
    testerRole,
    startedAt: new Date().toISOString(),
  }
  runs.push(run)
  await store.setJSON(runsKey(projectId), runs)
  return run
}
