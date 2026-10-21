alter table public.rental_requests
  add column if not exists partner_confirmed_at timestamptz;
