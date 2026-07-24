export type Status = 'not_started' | 'passed' | 'failed'

export interface Project {
  id: string
  name: string
  description: string | null
  invite_token: string
  invite_active: boolean
  created_at: string
}

export interface TestCase {
  id: string
  project_id: string
  title: string
  steps: string[]
  expected_result: string
  order_index: number
  created_at: string
}

export interface Result {
  id: string
  test_case_id: string
  status: Status
  tester_name: string | null
  fail_reason: string | null
  updated_at: string
}

export interface Screenshot {
  id: string
  result_id: string
  storage_path: string
  uploaded_at: string
}
