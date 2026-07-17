import { useAuth } from './lib/AuthContext'

function App() {
  const { session, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md border border-slate-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-brand-dark mb-1">
          OLUMPUS GLASSES LTD.
        </h1>
        <p className="text-sm text-slate-500 mb-6">Quotation Manager</p>

        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Logged in as {session?.user?.email}
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Auth is working. The real dashboard (New Quotation, Clients,
          Products, Settings) is built in Phase 4.
        </p>

        <button
          onClick={signOut}
          className="text-sm text-brand-dark hover:text-brand-mid underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default App
