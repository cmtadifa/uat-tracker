import { describe, it, expect } from 'vitest'
import type { Status, Project, Result } from '@/lib/types'

describe('shared types', () => {
  it('accepts only the three valid status values', () => {
    const statuses: Status[] = ['not_started', 'passed', 'failed']
    expect(statuses).toHaveLength(3)
  })

  it('a Project object matches the expected shape', () => {
    const project: Project = {
      id: '1', name: 'UAT 1', description: null, inviteToken: 'tok',
      inviteActive: true, createdAt: '2026-07-23T00:00:00Z',
    }
    expect(project.name).toBe('UAT 1')
  })

  it('a Result object embeds its screenshots directly', () => {
    const result: Result = {
      id: '1', testCaseId: 'tc1', status: 'failed', testerName: 'Jordan',
      failReason: 'broke', suggestion: null, updatedAt: '2026-07-23T00:00:00Z',
      screenshots: [{ id: 's1', storagePath: 'p/tc1/x.png', uploadedAt: '2026-07-23T00:00:00Z' }],
    }
    expect(result.screenshots).toHaveLength(1)
  })
})
