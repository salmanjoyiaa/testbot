// api/sheetsProxy.js
// Serverless endpoint to read a Google Sheet using a service account and return
// normalized rows for UI consumption. Caches results in-memory for a short TTL.

const { google } = require('googleapis')

const TTL = 10 * 60 * 1000 // 10 minutes
let cache = { ts: 0, rows: null }

function normalizeRow(r) {
  const out = {}
  for (const k in r) {
    if (!Object.prototype.hasOwnProperty.call(r, k)) continue
    out[String(k).trim()] = r[k]
  }

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

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    // serve from cache when fresh
    if (cache.rows && Date.now() - cache.ts < TTL) {
      return res.status(200).json({ items: cache.rows, cached: true })
    }

    const SHEET_ID = process.env.GOOGLE_SHEET_ID
    const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    const SHEET_TAB = process.env.SHEETS_TAB || 'UI'

    if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      return res.status(500).json({ error: 'Missing Google Sheets service account env vars' })
    }

    // normalize newline sequences in key if escaped
    const key = PRIVATE_KEY.includes('\\n') ? PRIVATE_KEY.replace(/\\n/g, '\n') : PRIVATE_KEY

    const jwtClient = new google.auth.JWT(
      CLIENT_EMAIL,
      null,
      key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    )

    await jwtClient.authorize()

    const sheets = google.sheets({ version: 'v4', auth: jwtClient })

    // read a broad range from the named tab and let the normalizer handle headers
    const range = `${SHEET_TAB}`
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })

    const values = (resp.data && resp.data.values) || []
    if (!values || values.length < 2) {
      cache = { ts: Date.now(), rows: [] }
      return res.status(200).json({ items: [], cached: false })
    }

    const [headers, ...rows] = values
    const data = rows.map(r => {
      const obj = {}
      headers.forEach((h, i) => {
        const key = String(h || '').trim()
        obj[key] = r[i]
      })
      return normalizeRow(obj)
    })

    const filtered = data.filter(x => x && x.label && x.available).sort((a, b) => b.priority - a.priority)

    cache = { ts: Date.now(), rows: filtered }

    return res.status(200).json({ items: filtered, cached: false })
  } catch (err) {
    console.error('sheetsProxy error:', err)
    return res.status(500).json({ error: err?.message || String(err) })
  }
}
