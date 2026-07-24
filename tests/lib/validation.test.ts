import { describe, it, expect } from 'vitest'
import { validateStatusUpdate, validateScreenshotFile } from '@/lib/validation'

describe('validateStatusUpdate', () => {
  it('accepts passed with no reason', () => {
    expect(validateStatusUpdate({ status: 'passed' })).toEqual({ valid: true })
  })

  it('rejects failed with no reason', () => {
    expect(validateStatusUpdate({ status: 'failed' })).toEqual({
      valid: false,
      error: 'A reason is required when marking a test case as Failed.',
    })
  })

  it('rejects failed with a blank/whitespace reason', () => {
    expect(validateStatusUpdate({ status: 'failed', failReason: '   ' })).toEqual({
      valid: false,
      error: 'A reason is required when marking a test case as Failed.',
    })
  })

  it('accepts failed with a real reason', () => {
    expect(validateStatusUpdate({ status: 'failed', failReason: 'Button does nothing' })).toEqual({ valid: true })
  })
})

describe('validateScreenshotFile', () => {
  it('accepts a small PNG', () => {
    expect(validateScreenshotFile({ type: 'image/png', size: 1024 })).toEqual({ valid: true })
  })

  it('rejects a non-image file', () => {
    expect(validateScreenshotFile({ type: 'application/pdf', size: 1024 })).toEqual({
      valid: false,
      error: 'Only image files are allowed.',
    })
  })

  it('rejects a file over 5MB', () => {
    expect(validateScreenshotFile({ type: 'image/png', size: 6 * 1024 * 1024 })).toEqual({
      valid: false,
      error: 'Screenshots must be 5MB or smaller.',
    })
  })
})
