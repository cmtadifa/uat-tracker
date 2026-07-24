import { describe, it, expect, beforeAll } from 'vitest'
import { signAdminSession, verifyAdminSession } from '@/lib/admin/session'

beforeAll(() => {
  process.env.ADMIN_COOKIE_SECRET = 'test-admin-secret-do-not-use-in-prod'
})

describe('admin session cookie', () => {
  it('round-trips a signed payload', () => {
    const token = signAdminSession({ iat: 1000 })
    expect(verifyAdminSession(token)).toEqual({ iat: 1000 })
  })

  it('rejects a tampered payload', () => {
    const token = signAdminSession({ iat: 1000 })
    const [, signature] = token.split('.')
    const tamperedPayload = Buffer.from(JSON.stringify({ iat: 999999 })).toString('base64url')
    expect(verifyAdminSession(`${tamperedPayload}.${signature}`)).toBeNull()
  })

  it('rejects a malformed token', () => {
    expect(verifyAdminSession('not-a-valid-token')).toBeNull()
  })
})
