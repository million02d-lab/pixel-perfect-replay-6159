-- All application mutations go through the authenticated Edge Function.
-- This prevents users from escalating roles or self-approving driver, partner, and vehicle records
-- by updating protected columns through the PostgREST API. Service-role operations remain server-only.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon, authenticated;

-- Keep read access limited by the existing RLS policies.
grant select on all tables in schema public to anon, authenticated;
