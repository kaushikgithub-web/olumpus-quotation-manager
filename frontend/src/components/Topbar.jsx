import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Topbar({ onOpenMenu = () => {} }) {
  const { session, signOut } = useAuth()

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between md:justify-end px-4 sm:px-6 gap-3 sm:gap-4">
      <button
        onClick={onOpenMenu}
        className="md:hidden text-slate-500 hover:text-brand-dark p-1.5 -ml-1.5 rounded hover:bg-slate-100"
        title="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="text-right min-w-0">
          <p className="text-sm font-medium text-slate-800 leading-tight truncate max-w-[40vw] sm:max-w-xs">
            {session?.user?.email}
          </p>
          <p className="text-xs text-slate-400 leading-tight">Admin</p>
        </div>

        <button
          onClick={signOut}
          title="Sign out"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-dark border border-slate-200 hover:border-brand-light rounded-md px-2.5 sm:px-3 py-1.5 transition-colors shrink-0"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
