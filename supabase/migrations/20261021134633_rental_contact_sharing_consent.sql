alter table public.rental_requests
  add column if not exists contact_sharing_accepted_at timestamptz;
