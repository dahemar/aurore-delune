// Simple Google Sheets API helper
// Reads a sheet by name and returns an array of objects using the header row

// Desactiva caché en desarrollo para ver cambios instantáneamente.
// En producción, mantiene una caché corta para rendimiento.
const CACHE_TTL_MS = import.meta.env.DEV ? 0 : 60 * 1000

function getEnv(key) {
  const value = import.meta.env[key]
  if (!value) {
    console.warn(`[sheetsApi] Missing env ${key}`)
  }
  return value
}

function getCacheKey(sheetName) {
  const id = getEnv('VITE_SPREADSHEET_ID') || 'UNKNOWN'
  return `sheets:${id}:${sheetName}`
}

export function setCachedSheetData(sheetName, data) {
  const payload = { ts: Date.now(), data }
  try {
    // Si TTL es 0, no cachear
    if (CACHE_TTL_MS === 0) return
    localStorage.setItem(getCacheKey(sheetName), JSON.stringify(payload))
  } catch {}
}

export function getCachedSheetData(sheetName) {
  try {
    // Si TTL es 0, desactivar lectura de caché
    if (CACHE_TTL_MS === 0) return null
    const raw = localStorage.getItem(getCacheKey(sheetName))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.ts || !parsed?.data) return null
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

export async function fetchSheetData(sheetName) {
  const apiKey = getEnv('VITE_GOOGLE_SHEETS_API_KEY')
  const spreadsheetId = getEnv('VITE_SPREADSHEET_ID')
  if (!apiKey || !spreadsheetId) {
    console.warn('[sheetsApi] Missing API key or Spreadsheet ID')
    return []
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn('[sheetsApi] Failed to fetch', sheetName, res.status)
    return []
  }
  const json = await res.json()
  const values = json?.values || []
  if (values.length === 0) return []
  const headers = values[0]
  const rows = values.slice(1)
  const objects = rows.map((row) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[String(h).trim()] = row[idx] ?? ''
    })
    return obj
  })
  return objects
}

export function processImageUrl(url) {
  if (!url) return url
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${trimmed.replace(/^\/+/, '')}`
} 