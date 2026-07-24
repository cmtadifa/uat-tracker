import type { Status } from '@/lib/types'

type ValidationResult = { valid: true } | { valid: false; error: string }

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

export function validateStatusUpdate(input: { status: Status; failReason?: string | null }): ValidationResult {
  if (input.status === 'failed' && (!input.failReason || input.failReason.trim().length === 0)) {
    return { valid: false, error: 'A reason is required when marking a test case as Failed.' }
  }
  return { valid: true }
}

export function validateScreenshotFile(file: { type: string; size: number }): ValidationResult {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files are allowed.' }
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { valid: false, error: 'Screenshots must be 5MB or smaller.' }
  }
  return { valid: true }
}
