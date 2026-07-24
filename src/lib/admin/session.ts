import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export interface AdminSessionPayload {
  iat: number
}

function getSecret(): string {
  const secret = process.env.ADMIN_COOKIE_SECRET
  if (!secret) throw new Error('ADMIN_COOKIE_SECRET is not set')
  return secret
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url')
}

export function signAdminSession(payload: AdminSessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyAdminSession(token: string): AdminSessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedPayload, signature] = parts

  const expectedSignature = sign(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (signatureBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null

  try {
    const decoded = Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    const payload = JSON.parse(decoded)
    if (typeof payload.iat !== 'number') return null
    return payload as AdminSessionPayload
  } catch {
    return null
  }
}

export function verifyAdminPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD is not set')
  const submittedBuffer = Buffer.from(submitted)
  const expectedBuffer = Buffer.from(expected)
  if (submittedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(submittedBuffer, expectedBuffer)
}

export async function requireAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_admin_session')?.value
  return sessionCookie !== undefined && verifyAdminSession(sessionCookie) !== null
}
