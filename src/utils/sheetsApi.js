// Google Sheets API helper optimizado para rendimiento
// Implementa caché inteligente, preload y mejor manejo de errores

// TTL del caché: 2 minutos en desarrollo, 5 minutos en producción (más rápido)
const CACHE_TTL_MS = import.meta.env.DEV ? 2 * 60 * 1000 : 5 * 60 * 1000

// Caché en memoria para acceso instantáneo
const memoryCache = new Map()

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
    // Caché en memoria para acceso instantáneo
    memoryCache.set(sheetName, payload)
    
    // Caché en localStorage para persistencia
    localStorage.setItem(getCacheKey(sheetName), JSON.stringify(payload))
  } catch (e) {
    console.warn('[sheetsApi] Cache write failed:', e)
  }
}

export function getCachedSheetData(sheetName) {
  try {
    // Primero intentar caché en memoria (más rápido)
    const memoryData = memoryCache.get(sheetName)
    if (memoryData && Date.now() - memoryData.ts <= CACHE_TTL_MS) {
      return memoryData.data
    }
    
    // Si no hay caché en memoria, intentar localStorage
    const raw = localStorage.getItem(getCacheKey(sheetName))
    if (!raw) return null
    
    const parsed = JSON.parse(raw)
    if (!parsed?.ts || !parsed?.data) return null
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null
    
    // Restaurar en caché de memoria
    memoryCache.set(sheetName, parsed)
    return parsed.data
  } catch (e) {
    console.warn('[sheetsApi] Cache read failed:', e)
    return null
  }
}

// Preload de datos para mejorar la experiencia del usuario
const preloadQueue = new Set()
const preloadPromises = new Map()

export async function preloadSheetData(sheetName) {
  if (preloadQueue.has(sheetName)) return
  if (preloadPromises.has(sheetName)) return preloadPromises.get(sheetName)
  
  preloadQueue.add(sheetName)
  const promise = fetchSheetData(sheetName).then(data => {
    preloadQueue.delete(sheetName)
    return data
  })
  
  preloadPromises.set(sheetName, promise)
  return promise
}

export async function fetchSheetData(sheetName) {
  const apiKey = getEnv('VITE_GOOGLE_SHEETS_API_KEY')
  const spreadsheetId = getEnv('VITE_SPREADSHEET_ID')
  
  if (!apiKey || !spreadsheetId) {
    console.warn('[sheetsApi] Missing API key or Spreadsheet ID')
    return []
  }
  
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}?key=${encodeURIComponent(apiKey)}`
    
    // Timeout de 10 segundos para evitar esperas infinitas
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=300' // 5 minutos de caché HTTP
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
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
  } catch (e) {
    if (e.name === 'AbortError') {
      console.warn('[sheetsApi] Request timeout for', sheetName)
    } else {
      console.error('[sheetsApi] Fetch failed for', sheetName, e)
    }
    return []
  }
}

export function processImageUrl(url) {
  if (!url) return url
  const trimmed = url.trim()
  
  // Check for BBCode format [img]url[/img] and extract the URL
  const bbcodeMatch = trimmed.match(/\[img\](.*?)\[\/img\]/i)
  if (bbcodeMatch) {
    const extractedUrl = bbcodeMatch[1].trim()
    // If the extracted URL is already a full URL, return it directly
    if (/^https?:\/\//i.test(extractedUrl) || /^data:/i.test(extractedUrl)) {
      return extractedUrl
    }
    // If it's a relative path, process it normally
    const base = import.meta.env.BASE_URL || '/'
    return `${base}${extractedUrl.replace(/^\/+/, '')}`
  }
  
  // Original logic for direct URLs
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${trimmed.replace(/^\/+/, '')}`
}

// Limpiar caché expirado
export function cleanupExpiredCache() {
  try {
    const now = Date.now()
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('sheets:')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (data?.ts && (now - data.ts > CACHE_TTL_MS)) {
            localStorage.removeItem(key)
          }
        } catch {}
      }
    })
    
    // Limpiar caché en memoria
    for (const [key, value] of memoryCache.entries()) {
      if (now - value.ts > CACHE_TTL_MS) {
        memoryCache.delete(key)
      }
    }
  } catch (e) {
    console.warn('[sheetsApi] Cache cleanup failed:', e)
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(cleanupExpiredCache, 5 * 60 * 1000) 