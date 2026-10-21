create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.account_role as enum ('passenger', 'driver', 'partner', 'admin');
create type public.vehicle_class as enum ('economy', 'comfort', 'van');
create type public.review_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.trip_status as enum ('requested', 'matched', 'driver_arriving', 'in_progress', 'completed', 'cancelled');
create type public.rental_request_status as enum ('pending', 'matched', 'approved', 'rejected', 'cancelled');
create type public.contact_status as enum ('new', 'in_review', 'resolved', 'spam');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) between 6 and 32),
  preferred_language text not null default 'ar' check (preferred_language in ('ar','fr','en')),
  role public.account_role not null default 'passenger',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.driver_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  license_country text not null default 'MA' check (char_length(license_country) = 2),
  license_expiry date,
  verification_status public.review_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) between 2 and 160),
  city text not null check (city in ('Rabat','Sale','Temara','Other')),
  contact_email text not null check (char_length(contact_email) <= 254),
  fleet_size integer not null default 1 check (fleet_size between 1 and 10000),
  verification_status public.review_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.driver_profiles(user_id) on delete cascade,
  vehicle_class public.vehicle_class not null default 'economy',
  make text not null check (char_length(trim(make)) between 1 and 80),
  model text not null check (char_length(trim(model)) between 1 and 80),
  color text,
  plate_number text not null check (char_length(trim(plate_number)) between 2 and 24),
  seats smallint not null default 4 check (seats between 1 and 15),
  verification_status public.review_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plate_number)
);

create table public.fare_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_class public.vehicle_class not null,
  base_fare_mad numeric(8,2) not null check (base_fare_mad >= 0),
  per_km_mad numeric(8,2) not null check (per_km_mad >= 0),
  per_minute_mad numeric(8,2) not null default 0 check (per_minute_mad >= 0),
  minimum_fare_mad numeric(8,2) not null default 0 check (minimum_fare_mad >= 0),
  platform_fee_mad numeric(8,2) not null default 2 check (platform_fee_mad >= 0),
  fuel_price_mad_per_l numeric(8,2) check (fuel_price_mad_per_l is null or fuel_price_mad_per_l >= 0),
  assumed_l_per_100km numeric(5,2) check (assumed_l_per_100km is null or assumed_l_per_100km >= 0),
  active boolean not null default false,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id),
  driver_id uuid references public.driver_profiles(user_id),
  pickup_label text not null check (char_length(trim(pickup_label)) between 1 and 240),
  pickup_latitude double precision not null check (pickup_latitude between -90 and 90),
  pickup_longitude double precision not null check (pickup_longitude between -180 and 180),
  destination_label text not null check (char_length(trim(destination_label)) between 1 and 240),
  destination_latitude double precision not null check (destination_latitude between -90 and 90),
  destination_longitude double precision not null check (destination_longitude between -180 and 180),
  route_distance_m integer check (route_distance_m is null or route_distance_m > 0),
  route_duration_s integer check (route_duration_s is null or route_duration_s > 0),
  vehicle_class public.vehicle_class not null default 'economy',
  quoted_fare_mad numeric(8,2) not null check (quoted_fare_mad >= 0),
  platform_fee_mad numeric(8,2) not null default 2 check (platform_fee_mad >= 0 and platform_fee_mad <= quoted_fare_mad),
  currency text not null default 'MAD' check (currency = 'MAD'),
  status public.trip_status not null default 'requested',
  requested_at timestamptz not null default now(),
  matched_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.driver_profiles(user_id) on delete cascade,
  partner_id uuid references public.partner_profiles(id) on delete set null,
  city text not null check (city in ('Rabat','Sale','Temara','Other')),
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.rental_request_status not null default 'pending',
  commission_free_until timestamptz,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  points_delta integer not null check (points_delta <> 0),
  reason text not null check (char_length(reason) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(trim(message)) between 1 and 5000),
  status public.contact_status not null default 'new',
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index vehicles_driver_id_idx on public.vehicles(driver_id);
create index trips_passenger_requested_idx on public.trips(passenger_id, requested_at desc);
create index trips_driver_status_idx on public.trips(driver_id, status);
create index trips_status_requested_idx on public.trips(status, requested_at);
create index trip_events_trip_created_idx on public.trip_events(trip_id, created_at);
create index rental_requests_driver_created_idx on public.rental_requests(driver_id, created_at desc);
create index rental_requests_partner_status_idx on public.rental_requests(partner_id, status);
create index loyalty_ledger_passenger_created_idx on public.loyalty_ledger(passenger_id, created_at desc);
create index fare_rules_active_class_idx on public.fare_rules(vehicle_class, active, valid_from desc);

create function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger driver_profiles_set_updated_at before update on public.driver_profiles for each row execute function private.set_updated_at();
create trigger partner_profiles_set_updated_at before update on public.partner_profiles for each row execute function private.set_updated_at();
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function private.set_updated_at();
create trigger trips_set_updated_at before update on public.trips for each row execute function private.set_updated_at();
create trigger rental_requests_set_updated_at before update on public.rental_requests for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.fare_rules enable row level security;
alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
alter table public.rental_requests enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.contact_messages enable row level security;

create policy "Profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Driver profile select own" on public.driver_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Driver profile insert own" on public.driver_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Driver profile update own" on public.driver_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Partner profile select own" on public.partner_profiles for select to authenticated using ((select auth.uid()) = owner_user_id);
create policy "Partner profile insert own" on public.partner_profiles for insert to authenticated with check ((select auth.uid()) = owner_user_id);
create policy "Partner profile update own" on public.partner_profiles for update to authenticated using ((select auth.uid()) = owner_user_id) with check ((select auth.uid()) = owner_user_id);
create policy "Vehicles select own" on public.vehicles for select to authenticated using ((select auth.uid()) = driver_id);
create policy "Vehicles insert own" on public.vehicles for insert to authenticated with check ((select auth.uid()) = driver_id);
create policy "Vehicles update own" on public.vehicles for update to authenticated using ((select auth.uid()) = driver_id) with check ((select auth.uid()) = driver_id);
create policy "Trips visible to passenger or assigned driver" on public.trips for select to authenticated using ((select auth.uid()) = passenger_id or (select auth.uid()) = driver_id);
create policy "Trip events visible to trip participants" on public.trip_events for select to authenticated using (
  exists (select 1 from public.trips t where t.id = trip_events.trip_id and ((select auth.uid()) = t.passenger_id or (select auth.uid()) = t.driver_id))
);
create policy "Rental requests select own" on public.rental_requests for select to authenticated using ((select auth.uid()) = driver_id);
create policy "Rental requests insert own" on public.rental_requests for insert to authenticated with check ((select auth.uid()) = driver_id);
create policy "Loyalty ledger select own" on public.loyalty_ledger for select to authenticated using ((select auth.uid()) = passenger_id);
create policy "Current active fare rules are readable" on public.fare_rules for select to anon, authenticated using (active = true and valid_from <= now() and (valid_until is null or valid_until > now()));
create policy "Contact messages are backend only" on public.contact_messages for all to anon, authenticated using (false) with check (false);

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.fare_rules to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, full_name, phone, preferred_language) on public.profiles to authenticated;
grant update (full_name, phone, preferred_language) on public.profiles to authenticated;
grant select on public.driver_profiles to authenticated;
grant insert (user_id, license_country, license_expiry) on public.driver_profiles to authenticated;
grant update (license_country, license_expiry) on public.driver_profiles to authenticated;
grant select on public.partner_profiles to authenticated;
grant insert (owner_user_id, business_name, city, contact_email, fleet_size) on public.partner_profiles to authenticated;
grant update (business_name, city, contact_email, fleet_size) on public.partner_profiles to authenticated;
grant select on public.vehicles to authenticated;
grant insert (driver_id, vehicle_class, make, model, color, plate_number, seats) on public.vehicles to authenticated;
grant update (vehicle_class, make, model, color, plate_number, seats) on public.vehicles to authenticated;
grant select on public.trips to authenticated;
grant select on public.trip_events to authenticated;
grant select on public.rental_requests to authenticated;
grant insert (driver_id, city, notes, partner_id, terms_version, terms_accepted_at) on public.rental_requests to authenticated;
grant select on public.loyalty_ledger to authenticated;
