import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

/**
 * Wraps any route that requires a logged-in admin. Redirects to /login if
 * there's no active session, and remembers the page they were trying to
 * reach so Login can send them back after signing in.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Avoid a flash-redirect to /login while the session is still being
    // checked on first page load.
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
