-- ============================================================================
-- Olumpus Quotation Manager — 004_seed_settings.sql
-- Run AFTER 001-003. Populates the singleton settings row with the exact
-- company details and Terms & Conditions from your original quotation
-- template, so quotations generated from day one match it.
--
-- Bold phrases in terms_and_conditions are wrapped in **double asterisks**
-- (markdown-style) — the Phase 8 PDF renderer will parse these back into
-- <strong> tags. This preserves your template's bold/plain mix, e.g.
-- "Wastage INCLUDED" being bold while the rest of that line is not.
-- ============================================================================

insert into settings (
  id, company_name, address, phone, email, website, gst_number,
  bank_details, terms_and_conditions, signature_name, director_name
)
values (
  1,
  'OLUMPUS GLASSES LTD.',
  '9/41 Suryodaya Colony, 9 Rana Pratap Marg, Lucknow-226001.',
  '+91 8933933333',
  'olumpusglasses@gmail.com',
  null,
  null,
  '{}'::jsonb,
  '[
    "GST will be extra.",
    "Packing and Forwarding **EXTRA** in Rate.",
    "**Wastage EXTRA** (as per current sizes provided, variation in sizes might attract changes in wastage charged)",
    "**Design wastage/ Geometrical cutting wastage** shall be extra as applicable.",
    "**Large size (above 8 sqm or any single side dimension of 3660 & above)** will be charged extra @ 20% on basic price",
    "**Extra Large size (Sizes above 2500mm x 2500mm or 4270mm)** will be charged extra @ 30% on basic price.",
    "**JUMBO Large size (Sizes above 2500mm x 2500mm or 4880mm)** will be charged extra @ 80% on basic price.",
    "**Wooden Packing charges** if applicable will be charged extra",
    "**Insurance** will be charged extra.",
    "**Payment Terms**: 100% advance against Performa invoice",
    "**Validity of the offer**: 7 days from the date of the offer."
  ]'::jsonb,
  'Authorized Signature',
  null   -- fill in the Director's name via the Settings page later
)
on conflict (id) do update set
  company_name         = excluded.company_name,
  address               = excluded.address,
  phone                 = excluded.phone,
  email                 = excluded.email,
  terms_and_conditions = excluded.terms_and_conditions,
  signature_name        = excluded.signature_name;

-- Optional starter products, so Product Master isn't empty on first login.
-- Feel free to delete/edit these from the Products page later.
insert into products (name, default_description, default_unit, default_rate)
values
  ('12MM Saint Gobain Low-E', '12MM SAINT GOBAIN LOW-E PLANITHERM WHITE TOUGHENED', 'SQM', null),
  ('10MM Toughened', '10MM TOUGHENED CLEAR GLASS', 'SQM', null),
  ('12MM Air Gap', '12MM AIR GAP', 'SQM', null),
  ('Laminated Glass', 'LAMINATED GLASS', 'SQM', null),
  ('Mirror', 'MIRROR', 'SQM', null),
  ('ACP', 'ALUMINIUM COMPOSITE PANEL (ACP)', 'SQM', null)
on conflict do nothing;
