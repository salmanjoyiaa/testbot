import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, isDark = false }) {
const [value, setValue] = useState('')
const [sending, setSending] = useState(false)
const [listening, setListening] = useState(false)
const recognitionRef = useRef(null)
const [supportsSpeech, setSupportsSpeech] = useState(true)

const handleSend = async () => {
const message = value.trim()
if (!message || sending) return
setSending(true)
setValue('')
try {
await onSend(message)
} finally {
setSending(false)
}
}

const handleKeyDown = (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault()
handleSend()
}
}

useEffect(() => {
	// Initialize SpeechRecognition if available
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
	setSupportsSpeech(Boolean(SpeechRecognition))
	if (!SpeechRecognition) return

	const recog = new SpeechRecognition()
	recog.continuous = false
	recog.interimResults = true
	recog.lang = navigator.language || 'en-US'

	recog.onresult = (event) => {
		let interim = ''
		let final = ''
		for (let i = event.resultIndex; i < event.results.length; ++i) {
			const transcript = event.results[i][0].transcript
			if (event.results[i].isFinal) final += transcript
			else interim += transcript
		}
		// Show interim transcript while speaking, then final when available
		setValue((prev) => {
			// If final exists, replace with final; else show interim appended to previous non-speech text
			if (final) {
				if (recognitionRef.current) recognitionRef.current.lastTranscript = final
				return final
			}
			if (interim) {
				if (recognitionRef.current) recognitionRef.current.lastTranscript = interim
				return interim
			}
			return prev
		})
	}

	recog.onend = () => {
		setListening(false)
		// Auto-send if there's any text captured
		if (recognitionRef.current && recognitionRef.current.lastTranscript && recognitionRef.current.lastTranscript.trim()) {
			const textToSend = recognitionRef.current.lastTranscript.trim()
			// clear stored transcript
			recognitionRef.current.lastTranscript = ''
			// send message
			handleSendVoice(textToSend)
		}
	}

	recog.onerror = (err) => {
		console.error('SpeechRecognition error', err)
		setListening(false)
	}

	recognitionRef.current = recog

	return () => {
		try { recog.stop() } catch (e) {}
		recognitionRef.current = null
	}
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

const handleSendVoice = async (text) => {
	if (!text) return
	setSending(true)
	setValue('')
	try {
		await onSend(text)
	} finally {
		setSending(false)
	}
}

const toggleListening = () => {
	const recog = recognitionRef.current
	if (!recog) {
		console.warn('SpeechRecognition not supported in this browser')
		return
	}

	if (listening) {
		try { recog.stop() } catch (e) { console.warn(e) }
		setListening(false)
	} else {
		// reset lastTranscript holder
		recognitionRef.current.lastTranscript = ''
		recog.start()
		setListening(true)
	}
}

return (
	<>
	<div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white/95 dark:from-slate-900/95 via-white/90 dark:via-slate-900/90 to-transparent pt-3 pb-3 sm:pb-4 border-t border-slate-200/50 dark:border-slate-700/40 backdrop-blur-xl">
<div className="mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-6">
<div className="flex items-end gap-2 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/25 transition-all duration-200 p-2 sm:p-3 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5">
<textarea
className="flex-1 resize-none outline-none p-2 rounded-lg h-10 max-h-28 text-sm bg-slate-50/80 dark:bg-slate-700/40 hover:bg-slate-100/80 dark:hover:bg-slate-600/50 focus:bg-white dark:focus:bg-slate-700/80 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-slate-100 border border-slate-200/40 dark:border-slate-600/30 focus:border-blue-400/50 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20"
placeholder="Ask about properties, pricing, amenities..."
value={value}
onChange={(e) => setValue(e.target.value)}
onKeyDown={handleKeyDown}
rows={1}
/>
{/* Microphone button */}
<button
	onClick={toggleListening}
	type="button"
	aria-pressed={listening}
	aria-label={listening ? 'Stop recording' : 'Start voice input'}
	className={`shrink-0 inline-flex items-center justify-center rounded-lg px-2 h-9 w-9 text-sm font-medium transition-all duration-150 ${listening ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 border border-slate-200/40 dark:border-slate-600/30'}`}
>
	{listening ? (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-pulse">
			<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
			<path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 5 5 0 0 0 4 4.9V19a1 1 0 1 0 2 0v-3.1A5 5 0 0 0 19 11z" />
		</svg>
	) : (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
			<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
			<path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 5 5 0 0 0 4 4.9V19a1 1 0 1 0 2 0v-3.1A5 5 0 0 0 19 11z" />
		</svg>
	)}
</button>
<button
onClick={handleSend}
disabled={sending || !value.trim()}
className="shrink-0 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-3 h-9 text-sm font-semibold hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:via-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 ring-1 ring-blue-400/20 disabled:ring-0"
aria-label="Send message"
>
{sending ? (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-5 sm:h-5 animate-spin">
<circle cx="12" cy="12" r="10"/>
</svg>
) : (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
<path d="M2.94 2.94a.75.75 0 0 1 .82-.17l13.5 5.4a.75.75 0 0 1 0 1.38l-13.5 5.4a.75.75 0 0 1-1.03-.87l1.33-4.67a.75.75 0 0 1 .52-.52l7.11-2.1-7.11-2.1a.75.75 0 0 1-.52-.52L2.73 3.1a.75.75 0 0 1 .21-.16z"/>
</svg>
)}
</button>
		</div>
		</div>
		</div>
		{!supportsSpeech && (
			<div className="mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-6 mt-1">
				<div className="text-xs text-slate-500 dark:text-slate-400">Voice input not supported in this browser. Try Chrome or Edge for best results.</div>
			</div>
		)}
	</>
)
}