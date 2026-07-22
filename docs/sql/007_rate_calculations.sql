-- ============================================================================
-- Olumpus Quotation Manager — 007_rate_calculations.sql
-- Run AFTER 001-006.
--
-- Backs the new Rate Calculator tool: a cost-buildup worksheet (Glass Basic
-- → Landed Total → Total 1 → Total 2 → Rate Given) matching the business's
-- existing spreadsheet formula chain. Every rate/percentage/fixed-cost
-- field is stored as typed input (not recomputed server-side) because the
-- business explicitly wants to type Fuel, Insurance, and both surcharge
-- rates by hand each time — they change with supplier pricing.
-- ============================================================================

create table if not exists rate_calculations (
  id                      uuid primary key default gen_random_uuid(),

  glass_name              text not null,
  product_id              uuid references products(id) on delete set null,

  -- --- Landed Total inputs ---
  mm                      numeric(10,2) not null,
  basic_per_mm            numeric(12,4) not null default 0,
  energy_surcharge_rate   numeric(12,4) not null default 0,   -- ₹ per mm, typed each time
  precious_metal_rate     numeric(12,4) not null default 0,   -- ₹ per mm, typed each time
  include_precious_metal  boolean not null default false,     -- sometimes included, sometimes not
  fuel                    numeric(12,4) not null default 0,   -- manual, from supplier price list
  insurance_landed        numeric(12,4) not null default 0,   -- manual, the Insurance INSIDE Landed Total

  process_loss_pct        numeric(6,3) not null default 3,
  profit_pct              numeric(6,3) not null default 3,

  -- --- Glass combination layers (Tempering, PVB, panes, air gap, etc.) ---
  -- Stored as [{ "label": "PVB 1.52MM", "cost": 1350 }, ...] — a flexible
  -- list because different glass combinations have different numbers of
  -- layers; a fixed set of columns wouldn't work across products.
  combination_layers      jsonb not null default '[]'::jsonb,

  -- --- Total 2 inputs ---
  freight                 numeric(12,4) not null default 0,
  insurance_pct           numeric(6,3) not null default 2,
  gst_pct                 numeric(6,3) not null default 18,

  -- --- Final decision ---
  rate_given              numeric(12,2),

  -- Snapshot of Total 2 at save time, purely so the list view can show a
  -- number without recomputing the whole formula chain on every row.
  -- The live calculator always recomputes from the inputs above, so this
  -- can never drift into being the "source of truth."
  total2_snapshot         numeric(12,4),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_rate_calculations_glass_name on rate_calculations(glass_name);
create index if not exists idx_rate_calculations_product on rate_calculations(product_id);

drop trigger if exists trg_rate_calculations_updated on rate_calculations;
create trigger trg_rate_calculations_updated before update on rate_calculations
  for each row execute function set_updated_at();

alter table rate_calculations enable row level security;

drop policy if exists "authenticated_all_rate_calculations" on rate_calculations;
create policy "authenticated_all_rate_calculations" on rate_calculations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
