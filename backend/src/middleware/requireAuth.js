import { supabaseAdmin } from '../config/supabaseClient.js'

/**
 * Protects backend routes by requiring a valid Supabase session token.
 *
 * The frontend sends the token Supabase gave it at login as:
 *   Authorization: Bearer <access_token>
 *
 * We ask Supabase to verify that token server-side (supabaseAdmin.auth.getUser
 * checks the token's signature and expiry against Supabase itself — we are
 * NOT just trusting whatever the client claims). If valid, req.user is set
 * so downstream route handlers know who's making the request.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  req.user = data.user
  next()
}
