import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

/**
 * Shell layout for every authenticated page. Sidebar + Topbar stay fixed;
 * <Outlet /> renders whichever page the route matches (Dashboard, New
 * Quotation, Clients, etc. — most are still placeholders until their
 * respective phases land).
 *
 * On small screens the sidebar becomes an off-canvas drawer toggled from
 * the Topbar's hamburger button, so the whole shell stays fully usable on
 * phones as well as laptops.
 */
export default function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
