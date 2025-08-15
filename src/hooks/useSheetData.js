import { useEffect, useState, useCallback } from 'react'
import { fetchSheetData, getCachedSheetData, setCachedSheetData, preloadSheetData } from '../utils/sheetsApi'

export function useSheetData(sheetName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    
    // Si no es forzado, intentar usar caché primero
    if (!forceRefresh) {
      const cached = getCachedSheetData(sheetName)
      if (cached) {
        setData(cached)
        setLoading(false)
        
        // En segundo plano, verificar si hay datos más frescos
        preloadSheetData(sheetName).then(fresh => {
          if (fresh && fresh.length > 0) {
            setData(fresh)
            setCachedSheetData(sheetName, fresh)
          }
        }).catch(() => {}) // Ignorar errores del preload
        
        return
      }
    }
    
    try {
      const fresh = await fetchSheetData(sheetName)
      setData(fresh)
      setCachedSheetData(sheetName, fresh)
      setLoading(false)
    } catch (e) {
      setError(e)
      setLoading(false)
    }
  }, [sheetName])

  useEffect(() => {
    let cancelled = false
    
    const load = async () => {
      if (cancelled) return
      await loadData(false)
    }
    
    load()
    
    return () => { 
      cancelled = true 
    }
  }, [loadData])

  // Función para refrescar datos manualmente
  const refresh = useCallback(() => {
    loadData(true)
  }, [loadData])

  return { data, loading, error, refresh }
} 