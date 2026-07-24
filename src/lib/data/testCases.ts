import { randomUUID } from 'crypto'
import { getDataStore, getEvidenceStore } from './store'
import { updateResult } from './results'
import type { TestCaseMeta } from '@/lib/types'

function testCasesKey(projectId: string): string {
  return `project:${projectId}:testcases`
}

export async function listTestCases(projectId: string): Promise<TestCaseMeta[]> {
  const store = getDataStore()
  const testCases = await store.get(testCasesKey(projectId), { type: 'json' })
  return (testCases as TestCaseMeta[] | null) ?? []
}

export async function createTestCase(
  projectId: string,
  input: { title: string; steps: string[]; expectedResult: string }
): Promise<TestCaseMeta> {
  const store = getDataStore()
  const testCases = await listTestCases(projectId)
  const testCase: TestCaseMeta = {
    id: randomUUID(),
    title: input.title,
    steps: input.steps,
    expectedResult: input.expectedResult,
    orderIndex: testCases.length,
  }
  testCases.push(testCase)
  await store.setJSON(testCasesKey(projectId), testCases)
  await updateResult(testCase.id, { status: 'not_started', testerName: null, failReason: null })
  return testCase
}

export async function updateTestCase(
  projectId: string,
  testCaseId: string,
  updates: Partial<Pick<TestCaseMeta, 'title' | 'steps' | 'expectedResult' | 'orderIndex'>>
): Promise<TestCaseMeta | null> {
  const store = getDataStore()
  const testCases = await listTestCases(projectId)
  const index = testCases.findIndex((tc) => tc.id === testCaseId)
  if (index === -1) return null

  testCases[index] = { ...testCases[index], ...updates }
  await store.setJSON(testCasesKey(projectId), testCases)
  return testCases[index]
}

export async function deleteTestCase(projectId: string, testCaseId: string): Promise<void> {
  const store = getDataStore()
  const testCases = await listTestCases(projectId)
  const remaining = testCases.filter((tc) => tc.id !== testCaseId)
  await store.setJSON(testCasesKey(projectId), remaining)
  await store.delete(`result:${testCaseId}`)

  const evidenceStore = getEvidenceStore()
  const { blobs } = await evidenceStore.list({ prefix: `${projectId}/${testCaseId}/` })
  await Promise.all(blobs.map((blob) => evidenceStore.delete(blob.key)))
}
