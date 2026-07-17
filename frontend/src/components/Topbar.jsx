import { LogOut } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Topbar() {
  const { session, signOut } = useAuth()

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-4">
      <div className="text-right">
        <p className="text-sm font-medium text-slate-800 leading-tight">
          {session?.user?.email}
        </p>
        <p className="text-xs text-slate-400 leading-tight">Admin</p>
      </div>

      <button
        onClick={signOut}
        title="Sign out"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-dark border border-slate-200 hover:border-brand-light rounded-md px-3 py-1.5 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </header>
  )
}
