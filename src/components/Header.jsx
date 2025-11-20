import DarkModeToggle from './DarkModeToggle'
import { useAuth } from '../context/AuthContext'

export default function Header({ isDark, onToggleDark, user }) {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-indigo-900/95 dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 border-b border-white/5 dark:border-slate-700/20 shadow-sm">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative p-1.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-lg shadow-md flex-shrink-0 ring-1 ring-blue-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path d="M11.97 3.979a.75.75 0 00-1.94 0A8.25 8.25 0 005.25 9H1.5a.75.75 0 000 1.5H3v9a3 3 0 003 3h12a3 3 0 003-3v-9h1.5a.75.75 0 000-1.5h-3.75A8.25 8.25 0 0011.97 3.979zM9 12.75a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm4-1.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6zm4 1.5a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-semibold text-base leading-tight">Property AI</h1>
              <p className="text-xs text-blue-200/80 dark:text-blue-300/80 font-medium">Smart Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-blue-200/80 dark:text-blue-300/80">Logged in as</p>
                  <p className="text-sm text-white font-medium truncate max-w-xs">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600/80 hover:bg-red-700 rounded-lg transition-colors active:scale-95"
                >
                  Logout
                </button>
              </div>
            )}
            <DarkModeToggle isDark={isDark} onToggle={onToggleDark} />
            <div className="text-xl hidden sm:block opacity-80">🏠</div>
          </div>
        </div>
      </div>
    </header>
  )
}