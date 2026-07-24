import { getDataStore } from './store'
import type { Result, Status, Screenshot } from '@/lib/types'

function resultKey(runId: string, testCaseId: string): string {
  return `result:${runId}:${testCaseId}`
}

export async function getResult(runId: string, testCaseId: string): Promise<Result | null> {
  const store = getDataStore()
  const result = await store.get(resultKey(runId, testCaseId), { type: 'json' })
  return (result as Result | null) ?? null
}

export async function updateResult(
  runId: string,
  testCaseId: string,
  updates: { status: Status; testerName: string | null; failReason: string | null }
): Promise<Result> {
  const store = getDataStore()
  const existing = await getResult(runId, testCaseId)
  const result: Result = {
    id: existing?.id ?? `${runId}:${testCaseId}`,
    testCaseId,
    runId,
    status: updates.status,
    testerName: updates.testerName,
    failReason: updates.status === 'failed' ? updates.failReason : null,
    updatedAt: new Date().toISOString(),
    screenshots: existing?.screenshots ?? [],
  }
  await store.setJSON(resultKey(runId, testCaseId), result)
  return result
}

export async function addScreenshot(runId: string, testCaseId: string, screenshot: Screenshot): Promise<Result> {
  const store = getDataStore()
  const existing = await getResult(runId, testCaseId)
  const result: Result = {
    id: existing?.id ?? `${runId}:${testCaseId}`,
    testCaseId,
    runId,
    status: existing?.status ?? 'not_started',
    testerName: existing?.testerName ?? null,
    failReason: existing?.failReason ?? null,
    updatedAt: existing?.updatedAt ?? new Date().toISOString(),
    screenshots: [...(existing?.screenshots ?? []), screenshot],
  }
  await store.setJSON(resultKey(runId, testCaseId), result)
  return result
}
