-- ============================================================================
-- Olumpus Quotation Manager — 002_functions.sql
-- Run AFTER 001_create_tables.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- generate_reference_number()
--
-- Returns the next reference number for the CURRENT year, e.g. 'OG/2026/086'.
--
-- Why this approach and not "just SELECT max + 1 in application code":
-- Two quotations created within milliseconds of each other could both read
-- the same "last number" before either writes it back, producing a duplicate
-- (e.g. both getting OG/2026/086). This function does the read-increment-write
-- as a single atomic database operation using INSERT ... ON CONFLICT, so
-- Postgres guarantees no two callers can ever get the same number, even
-- under concurrent requests.
-- ----------------------------------------------------------------------------
create or replace function generate_reference_number()
returns text
language plpgsql
as $$
declare
  current_yr   int := extract(year from current_date);
  next_number  int;
begin
  insert into reference_counter (year, last_number)
  values (current_yr, 1)
  on conflict (year)
  do update set last_number = reference_counter.last_number + 1
  returning last_number into next_number;

  return 'OG/' || current_yr || '/' || lpad(next_number::text, 3, '0');
end;
$$;

-- Quick manual test (run in SQL Editor, then check the result):
-- select generate_reference_number();   -- e.g. OG/2026/001
-- select generate_reference_number();   -- e.g. OG/2026/002
