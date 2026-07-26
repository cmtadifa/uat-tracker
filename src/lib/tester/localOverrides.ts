const KEY_PREFIX = 'uat_local_status_'

// The underlying Blobs store doesn't guarantee a read immediately after a
// write reflects that write (eventual consistency). Since the tester's own
// browser always knows the truth about what it JUST submitted, we keep a
// small local record per invite-link session and let it override whatever
// the server happens to return until the server catches up on its own.
export function getLocalOverrides(token: string): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + token)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setLocalOverride(token: string, testCaseId: string, status: string) {
  if (typeof window === 'undefined') return
  try {
    const overrides = getLocalOverrides(token)
    overrides[testCaseId] = status
    sessionStorage.setItem(KEY_PREFIX + token, JSON.stringify(overrides))
  } catch {
    // sessionStorage unavailable (private browsing, storage full, etc.) -- fine to skip
  }
}
