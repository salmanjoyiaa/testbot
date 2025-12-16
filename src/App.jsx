import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import StreamingMessage from './components/StreamingMessage'
import ChatInput from './components/ChatInput'
import { ToastProvider } from './components/Toast'
import TypingDots from './components/TypingDots'
import QuickActions from './components/QuickActions'
import PropertyCard from './components/PropertyCard'
import PropertyResultsCard from './components/PropertyResultsCard'
import EmptyState from './components/EmptyState'
import AuthPage from './pages/AuthPage'
import useChat from './hooks/useChat'
import useAutoScroll from './hooks/useAutoScroll'
import useDarkMode from './hooks/useDarkMode'
import useSmartSuggestions from './hooks/useSmartSuggestions'
import { useAuth } from './context/AuthContext'


export default function App() {
const { user, loading: authLoading } = useAuth()
const { messages, sendMessage, isLoading, error } = useChat()
const listRef = useRef(null)
useAutoScroll(listRef, [messages, isLoading], isLoading || messages.length > 0)
const [isDark, toggleDark] = useDarkMode()
const [currentIntent, setCurrentIntent] = useState(null)
const smartSuggestions = useSmartSuggestions(messages, currentIntent)


useEffect(() => {
// On first load, greet the user if there are no messages
if (!messages.length && user) {
sendMessage('', {
systemGreet: true,
})
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

// Show loading state while auth is initializing
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading…</p>
      </div>
    </div>
  )
}

// Show auth page if not logged in
if (!user) {
  return <AuthPage />
}


// Check if message contains property list (for PropertyCard)
const isPropertyList = (text) => {
  if (!text) return false
  // Check for bullet points, unit numbers, or property list patterns
  const hasBullets = text.includes('•') || text.includes('-')
  const unitMatches = text.match(/Unit\s+\d+/gi) || []
  const hasMultipleProperties = unitMatches.length > 1
  const hasExplicitListPattern = /Here are the|Here are all|properties in|properties with|properties by/i.test(text)
  
  // Only treat as property list if it has bullets OR (multiple units AND explicit list pattern)
  return hasBullets || (hasMultipleProperties && hasExplicitListPattern)
}

return (
  <ToastProvider>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 via-indigo-50/20 to-purple-50/10 dark:from-slate-950 dark:via-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors relative overflow-hidden">
  {/* Premium background pattern */}
  <div className="fixed inset-0 opacity-30 dark:opacity-10 pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.1),transparent_50%)]"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
  </div>

<Header isDark={isDark} onToggleDark={toggleDark} user={user} />

<main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 pt-1 relative z-10">
<div
ref={listRef}
className="mt-1 bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl rounded-2xl shadow-md p-4 sm:p-6 min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-12rem)] max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto border border-white/10 dark:border-slate-700/40 scroll-smooth will-change-scroll ring-1 ring-black/5 dark:ring-white/5"
>
{messages.length === 0 && !isLoading && (
<EmptyState onSelect={(question) => {
  sendMessage(question)
  if (question.toLowerCase().includes('unit')) {
    setCurrentIntent('property_query')
  } else {
    setCurrentIntent('dataset_query')
  }
}} />
)}
<div className="space-y-4" role="log" aria-live="polite" aria-atomic="false">
{messages.map((m, index) => {
  const isNewMessage = index === messages.length - 1
  
  // Check if this is a structured property results response
  if (m.role === 'bot' && m.structured) {
    const { type, message: introMsg, properties, area, areas, viewType } = m.structured
    
    if (type === 'property_results') {
      if (viewType === 'all_properties' && areas) {
        // Combine all properties from all areas
        const allProperties = [];
        Object.entries(areas).forEach(([areaName, props]) => {
          props.forEach(prop => {
            allProperties.push({ ...prop, area: areaName });
          });
        });

        return (
          <div key={m.id}>
            <div className="mb-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 font-semibold">
              {introMsg}
            </div>
            <PropertyResultsCard
              properties={allProperties}
              onQuickAction={(action) => {
                sendMessage(action)
                setCurrentIntent('property_query')
              }}
            />
          </div>
        )
      } else if (viewType === 'area_specific' && properties) {
        return (
          <div key={m.id}>
            <div className="mb-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 font-semibold">
              {introMsg}
            </div>
            <PropertyResultsCard
              properties={properties}
              area={area}
              onQuickAction={(action) => {
                sendMessage(action)
                setCurrentIntent('property_query')
              }}
            />
          </div>
        )
      } else if (properties && Array.isArray(properties)) {
        // Generic property_results response - render with PropertyResultsCard
        return (
          <div key={m.id}>
            <div className="mb-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 font-semibold">
              {introMsg}
            </div>
            <PropertyResultsCard
              properties={properties}
              area={area}
              onQuickAction={(action) => {
                sendMessage(action)
                setCurrentIntent('property_query')
              }}
            />
          </div>
        )
      }
    }
  }
  
  // Check if this is a property list response (fallback for text format)
  if (m.role === 'bot' && isPropertyList(m.text)) {
    // Split by bullet points or lines, handle both • and - bullets
    const lines = m.text.split(/\n/).filter(line => line.trim())
    const propertyItems = lines.filter(line => {
      const trimmed = line.trim()
      // Only match bullet points or lines that start with "Unit" followed by number and bullet/dash
      return trimmed.startsWith('•') || 
             trimmed.startsWith('-') || 
             /^Unit\s+\d+/.test(trimmed)
    })
    
    if (propertyItems.length > 0) {
      // Also show the intro text if present
      const introText = lines.find(line => 
        !line.trim().startsWith('•') && 
        !line.trim().startsWith('-') &&
        /Here are|Here is|properties/i.test(line)
      )
      
      return (
        <div key={m.id}>
          {introText && (
            <div className="mb-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">
              {introText.trim()}
            </div>
          )}
          <div className="space-y-3">
              {/*
                Use the structured `PropertyResultsCard` for text-based lists as well.
                Parse each bullet line into a small object that mimics the API record
                so the app shows a consistent card across all query types.
              */}
              {(() => {
                const parseLine = (line) => {
                  const t = line.replace(/^[•\-]\s*/, '').trim()
                  const unitMatch = t.match(/Unit\s+([^\n–]+?)(?:\s*–|$)/i)
                  const unit = unitMatch?.[1]?.trim() || ''
                  const unitNumber = unit.match(/^(\d+)/)?.[0] || ''
                  const titleMatch = t.match(/–\s*(.+?)(?:\s*\(|$)/)
                  const title = titleMatch?.[1]?.trim() || ''
                  // Use the whole line as address if we don't have a discrete address
                  const address = t

                  return {
                    unit,
                    unitNumber,
                    title,
                    // propertyResultsCard will prefer `Title on Listing's Site` or `title` for marketing title
                    'Title on Listing\'s Site': title,
                    address,
                    displayTitle: title,
                    displayAddress: address,
                  }
                }

                const parsed = propertyItems.map(item => parseLine(item))

                return (
                  <PropertyResultsCard
                    properties={parsed}
                    onQuickAction={(action) => {
                      sendMessage(action)
                      setCurrentIntent('property_query')
                    }}
                  />
                )
              })()}
          </div>
        </div>
      )
    }
  }
  
    return (
      <div key={m.id} aria-label={`${m.role} message`}> 
        <StreamingMessage 
          role={m.role} 
          text={m.text} 
          timestamp={m.timestamp}
          isNewMessage={isNewMessage}
          onComplete={() => {
            // Update intent based on response
            if (m.role === 'bot' && m.text) {
              if (m.text.includes('property') || m.text.includes('Unit')) {
                setCurrentIntent('property_query')
              } else if (m.text.includes('properties') || m.text.includes('Which')) {
                setCurrentIntent('dataset_query')
              }
            }
          }}
          onRetry={() => {
            // Find the most recent user message before this bot message and resend it
            let prevUser = null
            for (let i = index - 1; i >= 0; i--) {
              if (messages[i].role === 'user') {
                prevUser = messages[i].text
                break
              }
            }
            if (prevUser) {
              sendMessage(prevUser)
            }
          }}
        />
      </div>
    )
})}
</div>

{isLoading && (
<div>
<TypingDots />
</div>
)}

{error && (
<div className="mt-4 text-sm text-red-700 dark:text-red-300 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200/60 dark:border-red-800/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-red-500/10 dark:shadow-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/30">
<div className="flex items-start gap-3">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
</svg>
<span className="font-medium">{error}</span>
</div>
</div>
)}

{!isLoading && messages.length > 0 && smartSuggestions.length > 0 && (
<QuickActions 
  onSelect={(question) => {
    sendMessage(question)
    if (question.includes('property') || question.includes('Unit')) {
      setCurrentIntent('property_query')
    } else {
      setCurrentIntent('dataset_query')
    }
  }} 
  visible={!isLoading}
  suggestions={smartSuggestions}
/>
)}
</div>
</main>

<ChatInput onSend={(message) => {
  sendMessage(message)
  // Try to detect intent from message
  if (message.toLowerCase().includes('unit') || message.toLowerCase().match(/unit\s+\d+/i)) {
    setCurrentIntent('property_query')
  } else if (message.toLowerCase().includes('which') || message.toLowerCase().includes('properties')) {
    setCurrentIntent('dataset_query')
  }
}} isDark={isDark} />
    </div>
  </ToastProvider>
)
}