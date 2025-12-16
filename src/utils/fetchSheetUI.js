// Helper to fetch a public Apps Script JSON or other simple sheet JSON and normalize rows
export default async function fetchSheetUI() {
  const url = import.meta.env.VITE_SHEETS_PUBLIC_JSON_URL
  if (!url) throw new Error('VITE_SHEETS_PUBLIC_JSON_URL not set')

  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error('Failed to fetch sheet JSON: ' + res.status)

  const data = await res.json()

  let rows = []
  if (Array.isArray(data)) {
    rows = data
  } else if (data.values && Array.isArray(data.values)) {
    // Sheets values style: first row headers, rest rows
    const [headers, ...values] = data.values
    rows = values.map(r => {
      const obj = {}
      headers.forEach((h, i) => {
        const key = String(h || '').trim()
        obj[key] = r[i]
      })
      return obj
    })
  } else if (data.rows && Array.isArray(data.rows)) {
    rows = data.rows
  } else if (data.feed && Array.isArray(data.feed.entry)) {
    rows = data.feed.entry.map(e => e.content || e)
  } else if (data.items && Array.isArray(data.items)) {
    rows = data.items
  } else {
    // Unknown shape: try to coerce into an array if possible
    rows = []
  }

  function normalizeRow(r) {
    const out = {}
    for (const k in r) {
      if (!Object.prototype.hasOwnProperty.call(r, k)) continue
      const key = String(k).trim()
      out[key] = r[k]
    }

    // normalize common keys
    const availableRaw = out.available ?? out.Available ?? out.AVAILABLE
    const availableStr = String(availableRaw ?? '').toLowerCase()
    out.available = availableStr === 'true' || availableStr === 'yes' || availableStr === '1' || availableStr === 'y'

    out.priority = Number(out.priority ?? out.Priority ?? 0) || 0
    out.label = out.label || out.Label || out.name || out.Name || ''
    out.type = String(out.type || out.Type || 'action').toLowerCase()
    out.icon = out.icon || out.Icon || ''
    out.payload = out.payload || out.Payload || out.action || out.Action || out.label || ''
    out.groups = (out.groups || out.Groups || '').toString()

    return out
  }

  const normalized = rows
    .map(normalizeRow)
    .filter(r => r && r.label && r.available)
    .sort((a, b) => b.priority - a.priority)

  return normalized
}
