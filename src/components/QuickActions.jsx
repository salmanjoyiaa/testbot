import useSheetsButtons from '../hooks/useSheetsButtons'

const DEFAULT_QUESTIONS = [
  'Which properties have pools?',
  'Show me properties under $200',
  'Which property is a mansion?',
  "What's the highest-rated property?",
  'Properties with 3 bedrooms?',
  'Which properties sleep 8+ guests?',
]

export default function QuickActions({ onSelect, visible = true, suggestions = null }) {
  if (!visible) return null

  const { items: sheetItems, loading } = useSheetsButtons()

  // derive quick-action style suggestions from sheet rows (group contains 'quick_actions' or 'quick-actions')
  const sheetQuestions = (sheetItems || []).filter(i => {
    const g = (i.groups || '').toLowerCase()
    return g.includes('quick_actions') || g.includes('quick-actions') || i.type === 'action'
  }).map(i => i.payload || i.label)

  const questions = suggestions || (sheetQuestions.length > 0 ? sheetQuestions : DEFAULT_QUESTIONS)

  return (
    <div className="mt-5 sm:mt-7">
      <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 mb-4 px-1 break-words overflow-wrap-anywhere tracking-tight">
        {suggestions ? 'You might also want to know:' : loading ? 'Loading suggestions…' : 'Try asking:'}
      </p>
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {questions.slice(0, 6).map((question, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(question)}
            className="px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 rounded-full text-slate-700 dark:text-slate-200 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:border-blue-300/60 dark:hover:border-blue-600/60 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-[0.98] min-w-0 ring-1 ring-slate-100/50 dark:ring-slate-800/50"
            style={{
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: '1.5',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
            title={question}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}

