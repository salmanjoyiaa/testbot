import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from './Toast'

export default function StreamingMessage({ text, role = 'bot', timestamp, onComplete, isNewMessage = false, onRetry }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (!text) return

    // Show full text immediately for both user and bot messages.
    // This removes the typing/streaming animation so replies appear instantly.
    setDisplayedText(text)
    setIsStreaming(false)
    if (onComplete) onComplete()
  }, [text, role, onComplete, isNewMessage])

  useEffect(() => {
    // entrance animation
    const t = setTimeout(() => setMounted(true), 20)
    return () => clearTimeout(t)
  }, [])

  const isUser = role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedText || text || '')
      showToast('Copied to clipboard', 'success')
    } catch (e) {
      console.warn('Copy failed', e)
      showToast('Copy failed', 'error')
    }
  }

  const handleRetry = () => {
    if (onRetry) onRetry()
  }

  const handleRetryWithToast = () => {
    if (onRetry) {
      showToast('Regenerating response...', 'info')
      onRetry()
    }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-2`}> 
      <div
        className={`relative group ${isUser ? 'user bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white' : 'bot bg-gradient-to-br from-white to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 text-slate-800 dark:text-slate-100'} rounded-xl px-4 py-2.5 max-w-[82%] sm:max-w-[72%] md:max-w-[66%] border ${isUser ? 'border-blue-400/20' : 'border-slate-200/40 dark:border-slate-700/30'} break-words backdrop-blur-sm transition-all duration-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
      >
        {/* Action buttons: copy, retry */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150">
          <div className="relative">
            <button onClick={handleCopy} title="Copy message" aria-label="Copy message" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-slate-800/75 border border-white/60 dark:border-slate-700/40 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-700 dark:text-slate-100">
                <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1z" />
                <path d="M20 5H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h12v14z" />
              </svg>
            </button>
            {/* inline copied tooltip removed in favor of global toast */}
          </div>

          {onRetry && (
            <button onClick={handleRetryWithToast} title="Regenerate / Retry" aria-label="Retry message" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-slate-800/75 border border-white/60 dark:border-slate-700/40 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 text-slate-700 dark:text-slate-100">
                <path d="M21 12a9 9 0 1 1-3.4-7.1" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </button>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-p:leading-snug prose-strong:font-semibold prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs prose-a:text-blue-500 prose-a:font-medium hover:prose-a:underline">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{
              p: ({ node, ...props }) => <p className="whitespace-pre-wrap leading-snug text-sm" {...props} />,
              a: ({ node, ...props }) => (
                <a target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" {...props} />
              ),
              code: ({ node, inline, className, children, ...props }) => (
                inline ?
                  <code className={`${className || ''} font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded`} {...props}>{children}</code> :
                  <code className={`${className || ''} block font-mono text-xs`} {...props}>{children}</code>
              ),
            }}
          >
            {displayedText || ''}
          </ReactMarkdown>
        </div>

        {isStreaming && role === 'bot' && (
          <span className="inline-block w-1.5 h-4 ml-1.5 bg-blue-500 dark:bg-blue-400 animate-pulse rounded-sm" />
        )}

        {timestamp && (
          <div className={`mt-1 text-[11px] font-medium ${isUser ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}

