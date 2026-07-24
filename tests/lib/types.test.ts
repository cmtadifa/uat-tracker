import { describe, it, expect } from 'vitest'
import type { Status, Project } from '@/lib/types'

describe('shared types', () => {
  it('accepts only the three valid status values', () => {
    const statuses: Status[] = ['not_started', 'passed', 'failed']
    expect(statuses).toHaveLength(3)
  })

  it('a Project object matches the expected shape', () => {
    const project: Project = {
      id: '1', name: 'UAT 1', description: null, invite_token: 'tok',
      invite_active: true, created_by: 'admin-1', created_at: '2026-07-23T00:00:00Z',
    }
    expect(project.name).toBe('UAT 1')
  })
})
