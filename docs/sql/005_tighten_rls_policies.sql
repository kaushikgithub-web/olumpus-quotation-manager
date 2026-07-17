-- ============================================================================
-- Olumpus Quotation Manager — 005_tighten_rls_policies.sql
-- Run AFTER Phase 3's admin user has been created in Supabase Auth.
--
-- Replaces the Phase 2 "anyone with the anon key" policies with policies
-- that require a logged-in Supabase session. Once this runs, the frontend
-- will only be able to read/write data while a user is signed in — matching
-- what ProtectedRoute already enforces on the UI side.
-- ============================================================================

-- ---- CLIENTS ----
drop policy if exists "interim_all_clients" on clients;
create policy "authenticated_all_clients" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- PRODUCTS ----
drop policy if exists "interim_all_products" on products;
create policy "authenticated_all_products" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- SETTINGS ----
drop policy if exists "interim_all_settings" on settings;
create policy "authenticated_all_settings" on settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- QUOTATIONS ----
drop policy if exists "interim_all_quotations" on quotations;
create policy "authenticated_all_quotations" on quotations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- QUOTATION_ITEMS ----
drop policy if exists "interim_all_quotation_items" on quotation_items;
create policy "authenticated_all_quotation_items" on quotation_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- reference_counter still has no policy — untouched by anon OR authenticated
-- roles via the API. It's only ever modified through generate_reference_number()
-- or the backend's service_role key, which bypasses RLS entirely. This is
-- intentional and correct — leave it as-is.
