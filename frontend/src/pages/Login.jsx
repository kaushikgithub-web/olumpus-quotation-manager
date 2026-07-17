import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signIn(email, password)

    setSubmitting(false)

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : error.message)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full bg-white rounded-lg shadow-md border border-slate-200 p-8"
      >
        <h1 className="text-xl font-bold text-brand-dark text-center mb-1">
          OLUMPUS GLASSES LTD.
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Quotation Manager — Admin Login
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          placeholder="you@olumpusglasses.com"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-dark hover:bg-brand-mid text-white font-medium rounded py-2 text-sm transition-colors disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
