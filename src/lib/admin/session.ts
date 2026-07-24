import { cookies } from 'next/headers'

export interface AdminSessionPayload {
  iat: number
}

function getSecret(): string {
  const secret = process.env.ADMIN_COOKIE_SECRET
  if (!secret) throw new Error('ADMIN_COOKIE_SECRET is not set')
  return secret
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toBase64Url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64url')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(Buffer.from(value, 'base64url'))
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

async function sign(data: string): Promise<string> {
  const key = await getHmacKey(getSecret())
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64Url(signature)
}

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = await sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export async function verifyAdminSession(token: string): Promise<AdminSessionPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedPayload, signature] = parts

  const key = await getHmacKey(getSecret())
  let valid: boolean
  try {
    valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), new TextEncoder().encode(encodedPayload))
  } catch {
    return null
  }
  if (!valid) return null

  try {
    const decoded = Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    const payload = JSON.parse(decoded)
    if (typeof payload.iat !== 'number') return null
    return payload as AdminSessionPayload
  } catch {
    return null
  }
}

export async function verifyAdminPassword(submitted: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD is not set')
  const submittedHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(submitted)))
  const expectedHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(expected)))
  return timingSafeEqualBytes(submittedHash, expectedHash)
}

export async function requireAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('uat_admin_session')?.value
  return sessionCookie !== undefined && (await verifyAdminSession(sessionCookie)) !== null
}
