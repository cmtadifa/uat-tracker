import { createHmac, timingSafeEqual } from 'crypto'

export interface TesterSessionPayload {
  projectToken: string
  testerName: string
  iat: number
}

function getSecret(): string {
  const secret = process.env.TESTER_COOKIE_SECRET
  if (!secret) throw new Error('TESTER_COOKIE_SECRET is not set')
  return secret
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url')
}

export function signTesterSession(payload: TesterSessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyTesterSession(token: string): TesterSessionPayload | null {
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
    if (
      typeof payload.projectToken !== 'string' ||
      typeof payload.testerName !== 'string' ||
      typeof payload.iat !== 'number'
    ) {
      return null
    }
    return payload as TesterSessionPayload
  } catch {
    return null
  }
}
