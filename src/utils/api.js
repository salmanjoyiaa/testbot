// Centralized API call to the Vercel serverless function
const FALLBACK_API_PATH = '/api/proxyWebhook'
const WEBHOOK_URL = (import.meta.env.VITE_DIRECT_API_URL || FALLBACK_API_PATH)?.trim()

export async function sendToWebhook(message) {
	if (!WEBHOOK_URL) {
		throw new Error('Missing webhook URL. Set VITE_DIRECT_API_URL or ensure /api/proxyWebhook is reachable.')
	}

	const res = await fetch(WEBHOOK_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ message }),
	})

	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new Error(`Webhook error ${res.status}: ${text || res.statusText}`)
	}

	// Expected JSON: { reply: "...", extracted: {...}, structured: {...} }
	const data = await res.json()
	if (!data || typeof data.reply !== 'string') {
		throw new Error('Invalid response from webhook. Expected { reply: string }')
	}
	// Return reply, extracted, and structured data for rich rendering
	return { 
		reply: data.reply, 
		extracted: data.extracted || null,
		structured: data.structured || null
	}
}