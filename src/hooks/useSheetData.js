import { useEffect, useState } from 'react'
import { fetchSheetData, getCachedSheetData, setCachedSheetData } from '../utils/sheetsApi'

export function useSheetData(sheetName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const cached = getCachedSheetData(sheetName)
      if (cached) {
        setData(cached)
        setLoading(false)
      }
      try {
        const fresh = await fetchSheetData(sheetName)
        if (!cancelled) {
          setData(fresh)
          setCachedSheetData(sheetName, fresh)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [sheetName])

  return { data, loading, error }
} 