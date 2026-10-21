create table if not exists public.driver_presence (
  user_id uuid primary key references public.driver_profiles(user_id) on delete cascade,
  online boolean not null default false,
  last_seen_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists driver_presence_online_idx on public.driver_presence(online, updated_at desc);
alter table public.driver_presence enable row level security;
create policy "Driver presence select own" on public.driver_presence for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.driver_presence from anon, authenticated;
grant select on public.driver_presence to authenticated;
grant usage on schema public to authenticated;
create trigger driver_presence_set_updated_at before update on public.driver_presence for each row execute function private.set_updated_at();
