import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus2,
  History,
  Users,
  Package,
  Settings as SettingsIcon,
  Building2,
  Calculator,
  Tags,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/new-quotation', label: 'New Quotation', icon: FilePlus2 },
  { to: '/quotation-history', label: 'Quotation History', icon: History },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/rate-master', label: 'Rate Master', icon: Tags },
  { to: '/rate-calculator', label: 'Rate Calculator', icon: Calculator },
  { to: '/company-profile', label: 'Company Profile', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-brand-dark text-white flex flex-col min-h-screen">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-lg font-bold leading-tight">OLUMPUS GLASSES</p>
        <p className="text-xs text-white/60 tracking-wide">QUOTATION MANAGER</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-white/40 border-t border-white/10">
        v1.0 · Phase 4
      </div>
    </aside>
  )
}
