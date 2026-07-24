import { randomUUID } from 'crypto'
import { getDataStore } from './store'
import type { Project } from '@/lib/types'

const INDEX_KEY = 'index'

export async function listProjects(): Promise<Project[]> {
  const store = getDataStore()
  const index = await store.get(INDEX_KEY, { type: 'json' })
  return (index as Project[] | null) ?? []
}

export async function getProjectSummary(id: string): Promise<Project | null> {
  const projects = await listProjects()
  return projects.find((p) => p.id === id) ?? null
}

export async function createProject(input: { name: string; description: string | null }): Promise<Project> {
  const store = getDataStore()
  const projects = await listProjects()
  const project: Project = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    createdAt: new Date().toISOString(),
  }
  projects.push(project)
  await store.setJSON(INDEX_KEY, projects)
  await store.setJSON(`project:${project.id}:testcases`, [])
  await store.setJSON(`project:${project.id}:invites`, [])
  return project
}
