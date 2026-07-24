import { getStore } from '@netlify/blobs'

function blobConfig() {
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
    return { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN }
  }
  return {}
}

export function getDataStore() {
  return getStore({ name: 'uat-data', ...blobConfig() })
}

export function getEvidenceStore() {
  return getStore({ name: 'uat-evidence', ...blobConfig() })
}
