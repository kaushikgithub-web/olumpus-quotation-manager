import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

/**
 * Shell layout for every authenticated page. Sidebar + Topbar stay fixed;
 * <Outlet /> renders whichever page the route matches (Dashboard, New
 * Quotation, Clients, etc. — most are still placeholders until their
 * respective phases land).
 */
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
