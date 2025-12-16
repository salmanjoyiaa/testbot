import QuickActions from './QuickActions'

export default function EmptyState({ onSelect }) {
  return (
    <div className="text-center py-12 sm:py-16 px-2">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
        <div className="relative text-6xl sm:text-7xl mb-2 transform hover:scale-110 transition-transform duration-300">
          🏠
        </div>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 dark:from-slate-100 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent mb-4 px-4 tracking-tight">
        Welcome to Property AI
      </h2>
      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-10 px-4 max-w-2xl mx-auto leading-relaxed font-medium">
        Your intelligent assistant for property information, amenities, pricing, and more!
      </p>
      <div className="px-2">
        <QuickActions onSelect={onSelect} visible={true} suggestions={null} />
      </div>
    </div>
  )
}

