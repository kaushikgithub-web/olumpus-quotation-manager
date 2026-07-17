-- ============================================================================
-- Olumpus Quotation Manager — 001_create_tables.sql
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- CLIENTS
-- Autocomplete + auto-create logic (frontend) reads/writes here.
-- ----------------------------------------------------------------------------
create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  company      text,
  address      text,
  phone        text,
  email        text,
  gst_number   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_clients_name on clients using gin (to_tsvector('simple', name));

-- ----------------------------------------------------------------------------
-- PRODUCTS  (Product Master)
-- e.g. "12MM Saint Gobain Low-E", default description/unit/rate auto-fill
-- into a quotation line item when selected.
-- ----------------------------------------------------------------------------
create table if not exists products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  default_description text,
  default_unit        text,       -- e.g. 'SQM', 'RFT', 'NOS'
  default_rate        numeric(12,2),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SETTINGS  (singleton row — Company Profile + Terms & Conditions)
-- We enforce "singleton" with a check constraint on id = 1.
-- bank_details and terms_and_conditions are jsonb so the Settings page
-- can store structured, editable content instead of one giant text blob.
-- ----------------------------------------------------------------------------
create table if not exists settings (
  id                     smallint primary key default 1 check (id = 1),
  company_name           text not null default 'OLUMPUS GLASSES LTD.',
  address                text,
  phone                  text,
  email                  text,
  website                text,
  gst_number             text,
  logo_url               text,
  bank_details           jsonb default '{}'::jsonb,
  terms_and_conditions   jsonb default '[]'::jsonb,   -- array of strings, one per bullet
  signature_name         text default 'Authorized Signature',
  director_name          text,
  updated_at             timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- REFERENCE_COUNTER
-- One row per year. Incremented atomically (see 003_functions.sql) to
-- guarantee reference numbers like OG/2026/001, OG/2026/002 never collide,
-- even under concurrent requests.
-- ----------------------------------------------------------------------------
create table if not exists reference_counter (
  year         int primary key,
  last_number  int not null default 0
);

-- ----------------------------------------------------------------------------
-- QUOTATIONS
-- ----------------------------------------------------------------------------
create table if not exists quotations (
  id               uuid primary key default gen_random_uuid(),
  reference_number text not null unique,       -- e.g. 'OG/2026/085'
  client_id        uuid references clients(id) on delete restrict,
  project_name     text,
  quotation_date   date not null default current_date,
  validity_days    int default 7,
  gst_applicable   boolean default true,
  remarks          text,
  status           text not null default 'draft'
                     check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_quotations_client on quotations(client_id);
create index if not exists idx_quotations_ref on quotations(reference_number);
create index if not exists idx_quotations_date on quotations(quotation_date);
create index if not exists idx_quotations_status on quotations(status);

-- ----------------------------------------------------------------------------
-- QUOTATION_ITEMS
-- Line items. product_id is nullable because a user can type a fully custom
-- description without picking from Product Master.
-- ----------------------------------------------------------------------------
create table if not exists quotation_items (
  id             uuid primary key default gen_random_uuid(),
  quotation_id   uuid not null references quotations(id) on delete cascade,
  product_id     uuid references products(id) on delete set null,
  sno            int not null,               -- S.No. shown on the printed quote
  description    text not null,              -- rich text (HTML) — bold/bullets/tables allowed
  rate           numeric(12,2) not null,
  unit           text,
  quantity       numeric(12,2),               -- optional, per spec
  created_at     timestamptz not null default now()
);

create index if not exists idx_items_quotation on quotation_items(quotation_id);

-- ----------------------------------------------------------------------------
-- Auto-update `updated_at` on row changes
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clients_updated on clients;
create trigger trg_clients_updated before update on clients
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_quotations_updated on quotations;
create trigger trg_quotations_updated before update on quotations
  for each row execute function set_updated_at();

drop trigger if exists trg_settings_updated on settings;
create trigger trg_settings_updated before update on settings
  for each row execute function set_updated_at();
