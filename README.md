# Olumpus Quotation Manager

Quotation management system for **Olumpus Glasses Ltd.** — replaces manual Word-based quotations with a database-backed app that generates PDFs matching the original quotation template exactly.

## Status: Phase 6 & 7 — Client Master + Quotation Generator ✅

- **Clients**: full CRUD page + a reusable autocomplete component (search-as-you-type, auto-creates new clients on save).
- **New Quotation**: client autocomplete, project details, multiple line items with a rich text editor (bold/italic/bullets/tables) per description, product auto-fill, atomic reference number generation, Save (create or edit), and Duplicate.
- **Quotation History**: searchable by client/reference/project/date/status, shows who created each quotation, Edit and Duplicate actions.
- **Generate PDF** and **Print** buttons are intentionally disabled with a tooltip — they're built in Phase 8 and 9.

## Project Structure

```
olumpus-quotation-manager/
├── frontend/                  React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/             Route-level pages (Dashboard, New Quotation, etc.) — Phase 4+
│   │   ├── components/        Reusable UI pieces (tables, forms, header) — Phase 4+
│   │   ├── layouts/           Shell layout (sidebar + topbar) — Phase 4
│   │   ├── lib/                Supabase client, API helpers — Phase 2+
│   │   ├── assets/             Images, logo
│   │   ├── App.jsx             Root component
│   │   ├── main.jsx            Entry point
│   │   └── index.css           Tailwind entry + brand theme tokens
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   Node.js + Express API
│   ├── src/
│   │   ├── routes/             Express route definitions — Phase 3+
│   │   ├── controllers/        Route handler logic — Phase 3+
│   │   ├── config/              Supabase client, env config — Phase 2
│   │   ├── middleware/         Auth guard, error handling — Phase 3
│   │   ├── utils/               Reference number generator, PDF helpers — Phase 7+
│   │   └── server.js            Express app entry point
│   ├── .env.example
│   └── package.json
│
├── docs/                       SQL scripts, deployment notes (added in later phases)
├── .gitignore
└── README.md
```

## Why this stack (brief)

- **React + Vite**: fast dev server, simple build, deploys cleanly to Vercel's free tier.
- **Tailwind CSS v4**: utility-first styling, wired through the official `@tailwindcss/vite` plugin (no separate `postcss.config` needed in v4).
- **Express**: minimal, well-understood API layer; deploys to Render's free tier.
- **Supabase (Phase 2)**: free Postgres database + auth-ready, avoids running your own DB server.

## Prerequisites

- Node.js 18+ and npm installed on your machine.
- A terminal (this was built and tested on Node 20 / npm 10).

## Running locally

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **http://localhost:5173**. You should see a white card reading "Phase 1 setup complete."

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Runs at **http://localhost:5000**. Verify it's alive:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{"status":"ok","service":"Olumpus Quotation Manager API","timestamp":"..."}
```

## Common errors & fixes

| Error | Cause | Fix |
|---|---|---|
| `EADDRINUSE: address already in use :::5000` | Another process is already using port 5000 | Kill it: `lsof -ti:5000 \| xargs kill -9` (Mac/Linux) or change `PORT` in `backend/.env` |
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` inside `backend/` |
| Tailwind classes not applying | `@tailwindcss/vite` plugin missing from `vite.config.js`, or dev server not restarted after config change | Confirm `vite.config.js` includes `tailwindcss()` in `plugins`, then restart `npm run dev` |
| Blank white page in browser | Usually a JS error — check the browser console | Open DevTools console for the stack trace |
| `npm create vite` fails / hangs | Slow or blocked network | Retry, or check your network/proxy settings |

## What's next (Phase 8)

PDF Generator: a Puppeteer-based HTML template matching your original quotation exactly (same fonts, margins, colors, table structure, terms), rendering live data from a saved quotation into a downloadable PDF.

Waiting for your go-ahead before starting Phase 8.
