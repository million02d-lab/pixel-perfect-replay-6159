create unique index if not exists loyalty_ledger_trip_reason_unique
  on public.loyalty_ledger(trip_id, reason)
  where trip_id is not null;
