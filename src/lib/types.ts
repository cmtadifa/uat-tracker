export type Status = 'not_started' | 'passed' | 'failed'

export interface Project {
  id: string
  name: string
  description: string | null
  inviteToken: string
  inviteActive: boolean
  createdAt: string
}

export interface TestCaseMeta {
  id: string
  title: string
  steps: string[]
  expectedResult: string
  orderIndex: number
}

export interface Screenshot {
  id: string
  storagePath: string
  uploadedAt: string
}

export interface Result {
  id: string
  testCaseId: string
  status: Status
  testerName: string | null
  failReason: string | null
  updatedAt: string
  screenshots: Screenshot[]
}
