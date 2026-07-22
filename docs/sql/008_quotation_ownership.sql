-- ============================================================================
-- Olumpus Quotation Manager — 008_quotation_ownership.sql
-- Run AFTER 001-007.
--
-- Adds per-user visibility on quotations:
--   - A regular ("staff") user can only SELECT/UPDATE/DELETE quotations
--     THEY created (created_by_id, set automatically by the Phase 4 trigger
--     — never trusted from the frontend).
--   - A designated "owner" (the MD) can SELECT/UPDATE/DELETE every
--     quotation, regardless of who created it.
--   - Anyone authenticated can still CREATE a new quotation, and Product/
--     Client master data stays shared/visible to everyone as before — only
--     quotations (and their line items) get this restriction.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- user_roles — one row per user who needs elevated ("owner") access.
-- Absence of a row = ordinary staff user (the default, safe assumption).
-- ----------------------------------------------------------------------------
create table if not exists user_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  created_at  timestamptz not null default now()
);

alter table user_roles enable row level security;

-- Users can check their OWN role (used so the frontend can show/hide an
-- "all quotations" view appropriately) — but nobody can grant themselves
-- (or anyone else) the owner role through the app. That's deliberately
-- impossible via RLS here — promoting someone to owner is a manual step
-- run directly in the Supabase SQL Editor (see bottom of this file),
-- never exposed as an in-app action. This prevents privilege escalation
-- from within the app itself.
drop policy if exists "select_own_role" on user_roles;
create policy "select_own_role" on user_roles
  for select using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- is_owner() — small reusable helper so the RLS policies below stay
-- readable. SECURITY DEFINER + STABLE: safe to call inside other policies
-- without recursive RLS issues, and Postgres can cache the result within
-- one query.
-- ----------------------------------------------------------------------------
create or replace function is_owner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'owner'
  );
$$;

-- ----------------------------------------------------------------------------
-- QUOTATIONS — replace the Phase 3 "any authenticated user, full access"
-- policy with creator-or-owner rules.
-- ----------------------------------------------------------------------------
drop policy if exists "authenticated_all_quotations" on quotations;

create policy "select_own_or_owner_quotations" on quotations
  for select using (created_by_id = auth.uid() or is_owner());

create policy "update_own_or_owner_quotations" on quotations
  for update using (created_by_id = auth.uid() or is_owner())
  with check (created_by_id = auth.uid() or is_owner());

create policy "delete_own_or_owner_quotations" on quotations
  for delete using (created_by_id = auth.uid() or is_owner());

-- Any authenticated user can still create a quotation — created_by_id gets
-- stamped automatically by the trigger from 006_add_created_by.sql, so a
-- new quotation is always "owned" by whoever actually created it.
create policy "insert_quotations_authenticated" on quotations
  for insert with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- QUOTATION_ITEMS — line items don't have their own created_by column, so
-- their visibility follows their PARENT quotation's ownership.
-- ----------------------------------------------------------------------------
drop policy if exists "authenticated_all_quotation_items" on quotation_items;

create policy "access_items_via_parent_quotation" on quotation_items
  for all using (
    exists (
      select 1 from quotations q
      where q.id = quotation_items.quotation_id
        and (q.created_by_id = auth.uid() or is_owner())
    )
  )
  with check (
    exists (
      select 1 from quotations q
      where q.id = quotation_items.quotation_id
        and (q.created_by_id = auth.uid() or is_owner())
    )
  );

-- ============================================================================
-- ONE-TIME MANUAL STEP — run this yourself, once, to designate the MD:
--
--   insert into user_roles (user_id, role)
--   select id, 'owner' from auth.users where email = 'kaushik.olumpus@gmail.com'
--   on conflict (user_id) do update set role = 'owner';
--
-- Replace the email with whichever account should be the MD/owner. Every
-- other logged-in user is treated as regular staff by default — no row
-- needed for them, "staff" is the implicit default.
-- ============================================================================
