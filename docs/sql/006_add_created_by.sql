-- ============================================================================
-- Olumpus Quotation Manager — 006_add_created_by.sql
-- Run AFTER 001-005.
--
-- Adds "who created this quotation" tracking. This is deliberately done as
-- a database trigger, not something the frontend sends in the insert payload
-- — if it were just a form field, anyone could type someone else's name into
-- it. Instead, the database reads WHO IS ACTUALLY LOGGED IN (from the
-- Supabase session token attached to the request) and stamps that onto the
-- row automatically. The frontend cannot override it.
--
-- Two columns:
--   created_by_id    -> the Supabase auth.users UUID (stable, never changes
--                        even if the user's email changes later)
--   created_by_email -> the email at the time of creation (fast to display
--                        in tables/PDFs without an extra join or lookup)
-- ============================================================================

alter table quotations
  add column if not exists created_by_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by_email text;

create or replace function stamp_created_by()
returns trigger
language plpgsql
security definer   -- needed to read auth.users; runs with elevated rights
as $$
begin
  if new.created_by_id is null then
    new.created_by_id := auth.uid();
  end if;

  if new.created_by_email is null then
    new.created_by_email := (auth.jwt() ->> 'email');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_quotations_created_by on quotations;
create trigger trg_quotations_created_by
  before insert on quotations
  for each row execute function stamp_created_by();

-- Note: this only works when the insert happens through a request carrying
-- a user's session (i.e. the frontend, via the anon key + logged-in user).
-- If the backend ever inserts quotations using the service_role key directly
-- (no user session attached), auth.uid() will be null — in that case pass
-- created_by_email explicitly in the insert instead of relying on the trigger.
