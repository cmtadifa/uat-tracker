import { randomUUID } from 'crypto'
import { getDataStore } from './store'
import { listProjects } from './projects'
import type { Invite, Project } from '@/lib/types'

function invitesKey(projectId: string): string {
  return `project:${projectId}:invites`
}

export async function listInvites(projectId: string): Promise<Invite[]> {
  const store = getDataStore()
  const invites = await store.get(invitesKey(projectId), { type: 'json' })
  return (invites as Invite[] | null) ?? []
}

export async function createInvite(projectId: string): Promise<Invite> {
  const store = getDataStore()
  const invites = await listInvites(projectId)
  const invite: Invite = {
    id: randomUUID(),
    token: randomUUID(),
    testerName: null,
    claimedAt: null,
    active: true,
    createdAt: new Date().toISOString(),
  }
  invites.push(invite)
  await store.setJSON(invitesKey(projectId), invites)
  return invite
}

export async function setInviteActive(projectId: string, inviteId: string, active: boolean): Promise<Invite | null> {
  const store = getDataStore()
  const invites = await listInvites(projectId)
  const index = invites.findIndex((i) => i.id === inviteId)
  if (index === -1) return null
  invites[index] = { ...invites[index], active }
  await store.setJSON(invitesKey(projectId), invites)
  return invites[index]
}

export async function claimInvite(projectId: string, token: string, testerName: string): Promise<Invite | null> {
  const store = getDataStore()
  const invites = await listInvites(projectId)
  const index = invites.findIndex((i) => i.token === token)
  if (index === -1 || invites[index].claimedAt) return null
  invites[index] = { ...invites[index], testerName, claimedAt: new Date().toISOString() }
  await store.setJSON(invitesKey(projectId), invites)
  return invites[index]
}

export async function findInviteByToken(token: string): Promise<{ project: Project; invite: Invite } | null> {
  const projects = await listProjects()
  for (const project of projects) {
    const invites = await listInvites(project.id)
    const invite = invites.find((i) => i.token === token)
    if (invite) return { project, invite }
  }
  return null
}
