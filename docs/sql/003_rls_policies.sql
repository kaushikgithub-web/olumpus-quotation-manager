-- ============================================================================
-- Olumpus Quotation Manager — 003_rls_policies.sql
-- Run AFTER 001_create_tables.sql and 002_functions.sql
-- ============================================================================
--
-- IMPORTANT — read this before running:
--
-- Row Level Security (RLS) controls who can read/write each table when
-- accessed through the Supabase anon/public API key (which is what the
-- frontend will use). Right now (end of Phase 2) there is NO authentication
-- yet — that's built in Phase 3. So these policies are intentionally
-- permissive ("anyone with the anon key can read/write") just so the app
-- is functional end-to-end during development.
--
-- In Phase 3, once admin login exists, we will REPLACE these policies with
-- ones that check `auth.role() = 'authenticated'`, so only logged-in admin
-- users can read/write data. Do not treat this interim state as production
-- security — the backend's service_role key already bypasses RLS entirely
-- for privileged operations (like reference number generation), which is
-- the safer path and is what Phase 3 will lean on more.
-- ============================================================================

alter table clients             enable row level security;
alter table products            enable row level security;
alter table settings            enable row level security;
alter table reference_counter   enable row level security;
alter table quotations          enable row level security;
alter table quotation_items     enable row level security;

-- ---- INTERIM (Phase 2) policies: full access via anon key ----

drop policy if exists "interim_all_clients" on clients;
create policy "interim_all_clients" on clients
  for all using (true) with check (true);

drop policy if exists "interim_all_products" on products;
create policy "interim_all_products" on products
  for all using (true) with check (true);

drop policy if exists "interim_all_settings" on settings;
create policy "interim_all_settings" on settings
  for all using (true) with check (true);

drop policy if exists "interim_all_quotations" on quotations;
create policy "interim_all_quotations" on quotations
  for all using (true) with check (true);

drop policy if exists "interim_all_quotation_items" on quotation_items;
create policy "interim_all_quotation_items" on quotation_items
  for all using (true) with check (true);

-- reference_counter is intentionally NOT given a public policy — it should
-- only ever be touched via the generate_reference_number() function (which
-- runs with the privileges of the caller who invoked it) or the backend's
-- service_role key. No policy = no access via anon key, which is what we want.
