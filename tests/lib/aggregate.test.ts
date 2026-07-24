import { describe, it, expect } from 'vitest'
import { countByStatus, summarizeProjects } from '@/lib/aggregate'
import type { Result } from '@/lib/types'

function makeResult(overrides: Partial<Result>): Result {
  return {
    id: 'r1', testCaseId: 'tc1', status: 'not_started',
    testerName: null, failReason: null, updatedAt: '2026-07-23T00:00:00Z',
    screenshots: [],
    ...overrides,
  }
}

describe('countByStatus', () => {
  it('counts an empty list as all zero', () => {
    expect(countByStatus([])).toEqual({ notStarted: 0, passed: 0, failed: 0, total: 0 })
  })

  it('tallies a mix of statuses', () => {
    const results = [
      makeResult({ status: 'passed' }),
      makeResult({ status: 'passed' }),
      makeResult({ status: 'failed' }),
      makeResult({ status: 'not_started' }),
    ]
    expect(countByStatus(results)).toEqual({ notStarted: 1, passed: 2, failed: 1, total: 4 })
  })
})

describe('summarizeProjects', () => {
  it('summarizes across multiple projects', () => {
    const summary = summarizeProjects([
      { projectId: 'p1', results: [makeResult({ status: 'failed' }), makeResult({ status: 'passed' })] },
      { projectId: 'p2', results: [makeResult({ status: 'failed' })] },
    ])
    expect(summary).toEqual({ activeProjects: 2, totalFailures: 2 })
  })

  it('summarizes zero projects', () => {
    expect(summarizeProjects([])).toEqual({ activeProjects: 0, totalFailures: 0 })
  })
})
