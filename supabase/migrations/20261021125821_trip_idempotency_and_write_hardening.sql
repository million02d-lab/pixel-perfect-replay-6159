alter table public.trips
  add column if not exists client_request_id uuid,
  add column if not exists fare_rule_id uuid references public.fare_rules(id);

create unique index if not exists trips_passenger_client_request_unique
  on public.trips(passenger_id, client_request_id)
  where client_request_id is not null;

create policy "Current active fare rules are readable" on public.fare_rules for select to anon, authenticated using (active = true and valid_from <= now() and (valid_until is null or valid_until > now()));
create policy "Contact messages are backend only" on public.contact_messages for all to anon, authenticated using (false) with check (false);
grant usage on schema public to anon;
grant select on public.fare_rules to anon, authenticated;

revoke insert on public.rental_requests from authenticated;
revoke update, delete, insert on public.trip_events from anon, authenticated;
revoke insert, update, delete on public.loyalty_ledger from anon, authenticated;
revoke insert, update, delete on public.fare_rules from anon, authenticated;
revoke insert, update, delete on public.contact_messages from anon, authenticated;

create index if not exists trips_fare_rule_id_idx on public.trips(fare_rule_id);
