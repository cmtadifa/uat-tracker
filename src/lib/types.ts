export type Status = 'not_started' | 'passed' | 'failed'

export interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface Invite {
  id: string
  token: string
  testerName: string | null
  claimedAt: string | null
  active: boolean
  createdAt: string
}

export interface TestCaseMeta {
  id: string
  title: string
  steps: string[]
  expectedResult: string
  orderIndex: number
  suggestion: string | null
}

export interface Screenshot {
  id: string
  storagePath: string
  uploadedAt: string
}

export interface Result {
  id: string
  testCaseId: string
  inviteToken: string
  status: Status
  testerName: string | null
  failReason: string | null
  updatedAt: string
  screenshots: Screenshot[]
}
