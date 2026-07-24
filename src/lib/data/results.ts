import { getDataStore } from './store'
import type { Result, Status, Screenshot } from '@/lib/types'

function resultKey(inviteToken: string, testCaseId: string): string {
  return `result:${inviteToken}:${testCaseId}`
}

export async function getResult(inviteToken: string, testCaseId: string): Promise<Result | null> {
  const store = getDataStore()
  const result = await store.get(resultKey(inviteToken, testCaseId), { type: 'json' })
  return (result as Result | null) ?? null
}

export async function updateResult(
  inviteToken: string,
  testCaseId: string,
  updates: { status: Status; testerName: string | null; failReason: string | null }
): Promise<Result> {
  const store = getDataStore()
  const existing = await getResult(inviteToken, testCaseId)
  const result: Result = {
    id: existing?.id ?? `${inviteToken}:${testCaseId}`,
    testCaseId,
    inviteToken,
    status: updates.status,
    testerName: updates.testerName,
    failReason: updates.status === 'failed' ? updates.failReason : null,
    updatedAt: new Date().toISOString(),
    screenshots: existing?.screenshots ?? [],
  }
  await store.setJSON(resultKey(inviteToken, testCaseId), result)
  return result
}

export async function addScreenshot(inviteToken: string, testCaseId: string, screenshot: Screenshot): Promise<Result> {
  const store = getDataStore()
  const existing = await getResult(inviteToken, testCaseId)
  const result: Result = {
    id: existing?.id ?? `${inviteToken}:${testCaseId}`,
    testCaseId,
    inviteToken,
    status: existing?.status ?? 'not_started',
    testerName: existing?.testerName ?? null,
    failReason: existing?.failReason ?? null,
    updatedAt: existing?.updatedAt ?? new Date().toISOString(),
    screenshots: [...(existing?.screenshots ?? []), screenshot],
  }
  await store.setJSON(resultKey(inviteToken, testCaseId), result)
  return result
}
