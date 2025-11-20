import ReactMarkdown from 'react-markdown'

export default function PropertyCard({ property, onQuickAction }) {
  // Prefer structured property fields when available (from API).
  // Fall back to parsing a markdown/string `property` when necessary.
  const extractPropertyInfo = (input) => {
    if (input && typeof input === 'object') {
      const fullUnit = String(input.unit || input['Unit #'] || '').trim()
      const unitNumber = fullUnit.match(/^(\d+)/)?.[0] || ''
      const unitDescription = fullUnit.replace(/^\d+\s*/, '').trim() || ''

      return {
        unit: fullUnit,
        unitNumber,
        unitDescription,
        title: (input['Title on Listing\'s Site'] || input.displayTitle || input.title || '').trim(),
        displayAddress: (input.displayAddress || input.address || input.Address || '').trim(),
        price: input.price || input.rate || '',
        rating: input.rating || '',
        raw: null,
      }
    }

    // If not an object, try to parse the markdown/string blob
    const text = String(input || '')
    const fullUnitMatch = text.match(/Unit\s+([^\n–]+?)(?:\s*–|$)/i)
    const fullUnit = fullUnitMatch?.[1]?.trim() || ''
    const unitNumberMatch = fullUnit.match(/^(\d+)/i)
    const unitNumber = unitNumberMatch?.[1] || ''
    const unitDescription = fullUnit.replace(/^\d+\s*/, '').trim() || ''
    const titleMatch = text.match(/–\s*(.+?)(?:\s*\(|$)/)
    const priceMatch = text.match(/\$(\d+)/)
    const ratingMatch = text.match(/(\d+\.?\d*)\s*(?:star|rating)/i)

    return {
      unit: fullUnit,
      unitNumber: unitNumber,
      unitDescription: unitDescription,
      title: titleMatch?.[1]?.trim() || '',
      displayAddress: '',
      price: priceMatch?.[1] || '',
      rating: ratingMatch?.[1] || '',
      raw: text,
    }
  }

  const info = extractPropertyInfo(property)

  return (
    <div className="group p-5 sm:p-6 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700/60 shadow-md hover:shadow-xl shadow-slate-200/50 dark:shadow-black/30 transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 dark:hover:border-blue-600/30 ring-1 ring-slate-100/50 dark:ring-slate-800/50 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          {info.unitNumber && (
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30">
                  Unit {info.unitNumber}
                </span>
                {info.unitDescription && (
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {info.unitDescription}
                  </span>
                )}
              </div>
            </div>
          )}
          {info.title && info.title !== info.displayAddress && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
              {info.title}
            </span>
          )}
          {info.displayAddress && (
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 sm:mb-3 break-words leading-tight tracking-tight">
              {info.displayAddress}
            </h3>
          )}
        </div>
        {info.rating && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-xl flex-shrink-0 shadow-sm ring-1 ring-yellow-200/50 dark:ring-yellow-800/50">
            <span className="text-yellow-500 dark:text-yellow-400 text-base">⭐</span>
            <span className="text-xs sm:text-sm font-bold text-yellow-700 dark:text-yellow-300">
              {info.rating}
            </span>
          </div>
        )}
      </div>

      {info.price && (
        <div className="mb-3 sm:mb-4 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            ${info.price}
          </span>
          <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">/night</span>
        </div>
      )}

      {info.raw ? (
        <div className="prose prose-sm dark:prose-invert max-w-none mb-2 sm:mb-3 text-xs sm:text-sm">
          <ReactMarkdown>{info.raw}</ReactMarkdown>
        </div>
      ) : (
        info.displayAddress && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 italic">{info.displayAddress}</p>
        )
      )}

      {onQuickAction && (
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => onQuickAction(`What's the WiFi password of ${info.displayAddress || info.title || info.unit || ''}?`)}
            className="flex-1 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-600 dark:hover:to-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 border border-slate-200/50 dark:border-slate-600/50"
            title="📶 WiFi Info"
          >
            📶 WiFi Info
          </button>
          <button
            onClick={() => onQuickAction(`Does unit ${info.unitNumber} have parking?`)}
            className="flex-1 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-600 dark:hover:to-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 border border-slate-200/50 dark:border-slate-600/50"
            title="🚗 Parking"
          >
            🚗 Parking
          </button>
          <button
            onClick={() => onQuickAction(`Tell me more about unit ${info.unitNumber}`)}
            className="flex-1 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 text-blue-700 dark:text-blue-300 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 border border-blue-200/50 dark:border-blue-700/50"
            title="ℹ️ More Details"
          >
            ℹ️ More Details
          </button>
        </div>
      )}
    </div>
  )
}

