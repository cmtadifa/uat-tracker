import type { Result } from '@/lib/types'

export function countByStatus(results: Result[]) {
  const notStarted = results.filter((r) => r.status === 'not_started').length
  const passed = results.filter((r) => r.status === 'passed').length
  const failed = results.filter((r) => r.status === 'failed').length
  return { notStarted, passed, failed, total: results.length }
}

export function summarizeProjects(projectResults: { projectId: string; results: Result[] }[]) {
  const activeProjects = projectResults.length
  const totalFailures = projectResults.reduce(
    (sum, p) => sum + p.results.filter((r) => r.status === 'failed').length,
    0
  )
  return { activeProjects, totalFailures }
}
