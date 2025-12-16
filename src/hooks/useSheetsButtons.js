import { useState, useEffect } from 'react'
import fetchSheetUI from '../utils/fetchSheetUI'

let cache = { items: null, ts: 0 }
const TTL = 5 * 60 * 1000 // 5 minutes

async function fetchFromProxy() {
  const res = await fetch('/api/sheetsProxy')
  if (!res.ok) throw new Error('sheetsProxy fetch failed: ' + res.status)
  const json = await res.json()
  return json.items || []
}

export default function useSheetsButtons() {
  const [items, setItems] = useState(cache.items || [])
  const [loading, setLoading] = useState(!cache.items)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (cache.items && Date.now() - cache.ts < TTL) {
        setItems(cache.items)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const useProxy = import.meta.env.VITE_USE_SHEETS_PROXY === 'true'
        const res = useProxy ? await fetchFromProxy() : await fetchSheetUI()
        cache = { items: res, ts: Date.now() }
        if (mounted) {
          setItems(res)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()

    const id = setInterval(() => {
      if (Date.now() - cache.ts >= TTL) load()
    }, TTL)

    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  return { items, loading, error }
}
