import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { requireAuth } from './middleware/requireAuth.js'
import quotationsRouter from './routes/quotations.js'
import { closeBrowser } from './utils/pdfGenerator.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(morgan('dev'))

// --- Health check (used to verify the server is alive, and by Render's
// health checks after deployment in Phase 10) ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Olumpus Quotation Manager API',
    timestamp: new Date().toISOString(),
  })
})

// --- Phase 2 verification routes ---
// These exist ONLY to confirm Supabase is wired up correctly. They get
// replaced by real controllers/routes in Phase 5-7 (Product/Client/Quotation
// Master CRUD). Kept inline here on purpose, so this phase is easy to test
// without jumping across multiple new files.

app.get('/api/health/db', async (req, res, next) => {
  try {
    const { supabaseAdmin } = await import('./config/supabaseClient.js')
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('company_name, address, phone, email')
      .eq('id', 1)
      .single()

    if (error) throw error

    res.json({ status: 'ok', connected: true, settings: data })
  } catch (err) {
    next(err)
  }
})

// --- Phase 3 verification route ---
// Requires a valid Supabase session token. Test with:
//   curl http://localhost:5000/api/protected/ping                     -> 401
//   curl -H "Authorization: Bearer <token>" .../api/protected/ping    -> 200
app.get('/api/protected/ping', requireAuth, (req, res) => {
  res.json({ status: 'ok', message: `Hello, ${req.user.email}` })
})

// --- Real feature routes ---
app.use('/api/quotations', quotationsRouter)

// --- Future route mounts (added in later phases) ---
// app.use('/api/auth', authRoutes)          // Phase 3 — not needed, Supabase Auth handles this
// app.use('/api/clients', clientRoutes)     // Phase 6 — not needed, frontend talks to Supabase directly (RLS-protected)
// app.use('/api/products', productRoutes)   // Phase 5 — same as above
// app.use('/api/settings', settingsRoutes)  // same pattern, if/when a backend route is needed

// --- 404 fallback ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// --- Central error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

const server = app.listen(PORT, () => {
  console.log(`Olumpus Quotation Manager API running on port ${PORT}`)
})

// Close the shared Puppeteer browser (see utils/pdfGenerator.js) on shutdown
// so it doesn't linger as an orphaned Chromium process.
async function shutdown() {
  await closeBrowser()
  server.close(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
