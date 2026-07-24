import { describe, it, expect, beforeAll } from 'vitest'
import { signTesterSession, verifyTesterSession } from '@/lib/tester/session'

beforeAll(() => {
  process.env.TESTER_COOKIE_SECRET = 'test-secret-do-not-use-in-prod'
})

describe('tester session cookie', () => {
  it('round-trips a signed payload', () => {
    const token = signTesterSession({ projectToken: 'abc-123', runId: 'run-1', testerName: 'Jordan', iat: 1000 })
    const result = verifyTesterSession(token)
    expect(result).toEqual({ projectToken: 'abc-123', runId: 'run-1', testerName: 'Jordan', iat: 1000 })
  })

  it('rejects a tampered payload', () => {
    const token = signTesterSession({ projectToken: 'abc-123', runId: 'run-1', testerName: 'Jordan', iat: 1000 })
    const [, signature] = token.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({ projectToken: 'other-project', runId: 'run-1', testerName: 'Jordan', iat: 1000 })
    ).toString('base64url')
    const tampered = `${tamperedPayload}.${signature}`
    expect(verifyTesterSession(tampered)).toBeNull()
  })

  it('rejects a malformed token', () => {
    expect(verifyTesterSession('not-a-valid-token')).toBeNull()
  })
})
