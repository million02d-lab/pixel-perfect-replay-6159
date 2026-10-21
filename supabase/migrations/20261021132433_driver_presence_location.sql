alter table public.driver_presence
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.driver_presence drop constraint if exists driver_presence_latitude_range_check;
alter table public.driver_presence add constraint driver_presence_latitude_range_check
  check (latitude is null or latitude between -90 and 90);

alter table public.driver_presence drop constraint if exists driver_presence_longitude_range_check;
alter table public.driver_presence add constraint driver_presence_longitude_range_check
  check (longitude is null or longitude between -180 and 180);

create index if not exists driver_presence_online_location_idx
  on public.driver_presence(online, latitude, longitude)
  where online = true and latitude is not null and longitude is not null;
