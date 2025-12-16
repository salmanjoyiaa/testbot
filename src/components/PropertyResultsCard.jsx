import { useState, useMemo, useCallback } from 'react'
import useSheetsButtons from '../hooks/useSheetsButtons'

export default function PropertyResultsCard({ properties = [], area, onQuickAction }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const { items: sheetItems = [], loading: sheetLoading } = useSheetsButtons()

  // Validate properties array - keep full unit value from sheet
  const validProperties = useMemo(() => {
    if (!Array.isArray(properties)) return []
    return properties.filter(p => p && typeof p === 'object' && p.unit).map(p => {
      const fullUnit = String(p.unit).trim()
      // Extract just the number for key purposes
      const unitNumber = fullUnit.match(/^\d+/)?.[0] || fullUnit
      // Extract the descriptive part (e.g., "Tempa Road" from "1679 Tempa Road")
      const unitDescription = fullUnit.replace(/^\d+\s*/, '').trim() || ''
      
      return {
        ...p,
        unit: fullUnit, // Keep complete unit value
        unitNumber: unitNumber, // Just the number
        unitDescription: unitDescription, // The descriptive part
        // Title on Listing's Site (marketing title) - prefer the sheet value explicitly
        displayTitle: (p['Title on Listing\'s Site'] || p.title || '').trim(),
        // Exact address from sheet
        displayAddress: (p.address || p['Address'] || '').trim()
      }
    })
  }, [properties])

  // Extract unique filters from properties
  const filters = useMemo(() => {
    const hasPool = validProperties.some(p => p.hasPool === true)
    const hasCamera = validProperties.some(p => p.hasCamera === true)
    const types = new Set(validProperties.map(p => p.type).filter(Boolean))

    return {
      hasPool,
      hasCamera,
      types: Array.from(types).sort(),
    }
  }, [validProperties])

  // derive sheet-driven filters (group contains 'filters')
  const sheetFilters = useMemo(() => {
    if (!Array.isArray(sheetItems)) return []
    return sheetItems
      .filter(i => (i.groups || '').toLowerCase().includes('filters') || i.type === 'filter')
      .map(i => ({
        label: i.label,
        payload: (i.payload || i.label || '').toString(),
        priority: i.priority || 0,
        icon: i.icon || '',
      }))
      .sort((a, b) => b.priority - a.priority)
  }, [sheetItems])

  const countForFilter = useCallback(
    payload => {
      const key = String(payload || '').toLowerCase()
      if (key === 'pool') return validProperties.filter(p => p.hasPool).length
      if (key === 'camera' || key === 'security') return validProperties.filter(p => p.hasCamera).length
      // treat as type
      return validProperties.filter(p => String(p.type || '').toLowerCase() === key).length
    },
    [validProperties]
  )

  // derive sheet-driven quick actions
  const sheetQuickActions = useMemo(() => {
    if (!Array.isArray(sheetItems)) return []
    return sheetItems
      .filter(i => (i.groups || '').toLowerCase().includes('quick_actions') || (i.groups || '').toLowerCase().includes('quick-actions') || i.type === 'action')
      .map(i => ({
        label: i.label,
        payload: i.payload || i.label,
        icon: i.icon || '',
        priority: i.priority || 0,
      }))
      .sort((a, b) => b.priority - a.priority)
  }, [sheetItems])

  function renderPayloadForProperty(payload, prop) {
    if (!payload) return ''
    return String(payload)
      .replace(/\{unitNumber\}/gi, prop.unitNumber || '')
      .replace(/\{unit\}/gi, prop.unit || '')
      .replace(/\{address\}/gi, prop.displayAddress || '')
      .replace(/\{displayAddress\}/gi, prop.displayAddress || '')
      .replace(/\{unitDescription\}/gi, prop.unitDescription || '')
  }

  // Filter properties based on active filter
  const filteredProperties = useMemo(() => {
    if (activeFilter === 'all') return validProperties
    if (activeFilter === 'pool') return validProperties.filter(p => p.hasPool === true)
    if (activeFilter === 'camera') return validProperties.filter(p => p.hasCamera === true)
    return validProperties.filter(p => p.type === activeFilter)
  }, [validProperties, activeFilter])

  return (
    <div className="space-y-4 w-full">
      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
        {/* All Properties Button */}
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
            activeFilter === 'all'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20'
              : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50'
          }`}
        >
          All ({validProperties.length})
        </button>

        {/* Pool/Hot Tub Filter */}
        {filters.hasPool && (
          <button
            onClick={() => setActiveFilter('pool')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeFilter === 'pool'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20'
                : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50'
            }`}
          >
            <span>🏊</span>
            <span>Pool ({validProperties.filter(p => p.hasPool).length})</span>
          </button>
        )}

        {/* Camera Filter */}
        {filters.hasCamera && (
          <button
            onClick={() => setActiveFilter('camera')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeFilter === 'camera'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20'
                : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50'
            }`}
          >
            <span>📹</span>
            <span>Security ({validProperties.filter(p => p.hasCamera).length})</span>
          </button>
        )}

        {/* Property Type Filters */}
        {filters.types.map(type => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 capitalize ${
              activeFilter === type
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20'
                : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50'
            }`}
          >
            {type} ({validProperties.filter(p => p.type === type).length})
          </button>
        ))}
      </div>

      {/* Property Grid */}
      <div className="space-y-3">
        {filteredProperties.length === 0 ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm">No properties match this filter</p>
          </div>
        ) : (
          filteredProperties.map((prop, idx) => (
            <div
              key={`${prop.unit}-${idx}`}
              className="group p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Header: Unit Info + Rating */}
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                {prop.unit && (
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md shadow-sm whitespace-nowrap">
                        Unit {prop.unitNumber}
                      </span>
                      {prop.unitDescription && (
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {prop.unitDescription}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {prop.rating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100/70 dark:bg-yellow-900/40 rounded-md flex-shrink-0 whitespace-nowrap">
                    <span className="text-yellow-500 dark:text-yellow-400 text-sm">⭐</span>
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-200">
                      {prop.rating}
                    </span>
                  </div>
                )}
              </div>

              {/* Marketing Title (Title on Listing's Site) - shown below the Unit badge */}
              {prop.displayTitle && prop.displayTitle !== prop.displayAddress && (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  {prop.displayTitle}
                </span>
              )}

              {/* Exact Address from Sheet - primary card title */}
              {prop.displayAddress && (
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">
                  {prop.displayAddress}
                </h4>
              )}

              {/* Type + Bed x Bath */}
              {(prop.type || prop.bedBath) && (
                <div className="flex flex-wrap gap-2 mb-3 text-xs">
                  {prop.type && (
                    <span className="px-2 py-1 bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 rounded capitalize font-medium">
                      {prop.type}
                    </span>
                  )}
                  {prop.bedBath && (
                    <span className="px-2 py-1 bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 rounded font-medium">
                      {prop.bedBath}
                    </span>
                  )}
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                {prop.price && (
                  <div className="bg-slate-50/80 dark:bg-slate-700/30 p-2 rounded border border-slate-200/40 dark:border-slate-600/30">
                    <span className="text-slate-600 dark:text-slate-400 text-xs block mb-0.5">Price</span>
                    <span className="font-bold text-blue-600 dark:text-blue-300">${prop.price}/n</span>
                  </div>
                )}
                {prop.maxGuests && (
                  <div className="bg-slate-50/80 dark:bg-slate-700/30 p-2 rounded border border-slate-200/40 dark:border-slate-600/30">
                    <span className="text-slate-600 dark:text-slate-400 text-xs block mb-0.5">Guests</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">Max {prop.maxGuests}</span>
                  </div>
                )}
                {(prop.area || area) && (
                  <div className="bg-slate-50/80 dark:bg-slate-700/30 p-2 rounded border border-slate-200/40 dark:border-slate-600/30">
                    <span className="text-slate-600 dark:text-slate-400 text-xs block mb-0.5">Area</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                      {prop.area || area}
                    </span>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {(prop.hasPool || prop.hasCamera || prop.hasWifi) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {prop.hasPool && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100/70 dark:bg-blue-900/35 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                      🏊 Pool
                    </span>
                  )}
                  {prop.hasCamera && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100/70 dark:bg-purple-900/35 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                      📹 Security
                    </span>
                  )}
                  {prop.hasWifi && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100/70 dark:bg-green-900/35 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                      📶 WiFi
                    </span>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              {onQuickAction && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/30 dark:border-slate-700/30">
                  {sheetQuickActions.length > 0 ? (
                    sheetQuickActions.map((act, ai) => {
                      const btnText = act.label || act.payload || 'Action'
                      return (
                        <button
                          key={`sqa-${ai}`}
                          onClick={() => {
                            const payload = renderPayloadForProperty(act.payload, prop)
                            if (/^https?:\/\//i.test(payload)) {
                              window.open(payload, '_blank')
                            } else {
                              onQuickAction(payload)
                            }
                          }}
                          className="flex-1 min-w-[90px] px-3 py-2 text-xs font-semibold bg-slate-100/80 dark:bg-slate-700/40 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded transition-all duration-150 active:scale-95"
                        >
                          {act.icon ? <span className="mr-1">{act.icon}</span> : null}
                          {btnText}
                        </button>
                      )
                    })
                  ) : (
                    <>
                      <button
                        onClick={() => onQuickAction(`What's the WiFi password of ${prop.displayAddress || prop.unit || ''}?`)}
                        className="flex-1 min-w-[90px] px-3 py-2 text-xs font-semibold bg-blue-100/80 dark:bg-blue-900/40 hover:bg-blue-200/80 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-200 rounded transition-all duration-150 active:scale-95"
                      >
                        📶 WiFi
                      </button>
                      <button
                        onClick={() => onQuickAction(`Does unit ${prop.unit}${prop.unitDescription ? ' ' + prop.unitDescription : ''} have parking?`)}
                        className="flex-1 min-w-[90px] px-3 py-2 text-xs font-semibold bg-slate-100/80 dark:bg-slate-700/40 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded transition-all duration-150 active:scale-95"
                      >
                        🚗 Parking
                      </button>
                      <button
                        onClick={() => onQuickAction(`Tell me more about unit ${prop.unitNumber}`)}
                        className="flex-1 min-w-[90px] px-3 py-2 text-xs font-semibold bg-indigo-100/80 dark:bg-indigo-900/40 hover:bg-indigo-200/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 rounded transition-all duration-150 active:scale-95"
                      >
                        ℹ️ Details
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
