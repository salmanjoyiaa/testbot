export default function TypingDots() {
  return (
    <div className="flex items-center">
      <div className="bg-gradient-to-r from-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-700/50 px-5 sm:px-6 py-3.5 sm:py-4 inline-flex items-center gap-3.5 shadow-md shadow-slate-200/50 dark:shadow-black/20 ring-1 ring-slate-100/50 dark:ring-slate-800/50 backdrop-blur-sm">
        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold tracking-wide">AI is thinking...</span>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 animate-bounce [animation-delay:-0.2s] shadow-sm"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 animate-bounce [animation-delay:0s] shadow-sm"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 animate-bounce [animation-delay:0.2s] shadow-sm"></span>
        </div>
      </div>
    </div>
  )
}