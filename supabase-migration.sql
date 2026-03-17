-- =============================================================
-- Timeliner — Supabase schema migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- Timelines table
create table if not exists timelines (
  id          text primary key,
  device_id   text not null,
  name        text not null default 'Untitled',
  sort_order  text not null default 'date-asc',
  active_view text not null default 'vertical',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Events table
create table if not exists events (
  id              text not null,
  timeline_id     text not null references timelines(id) on delete cascade,
  title           text not null default 'Untitled',
  description     text,
  date_start      text,
  date_end        text,
  date_raw        text,
  date_precision  text not null default 'day',
  flagged         boolean not null default false,
  flag_reason     text,
  people          jsonb not null default '[]',
  tags            jsonb not null default '[]',
  photos          jsonb not null default '[]',
  sort_index      integer not null default 0,
  created_at      timestamptz not null default now(),
  primary key (id, timeline_id)
);

-- Indexes for fast lookups
create index if not exists idx_timelines_device on timelines(device_id);
create index if not exists idx_events_timeline  on events(timeline_id);

-- Composite indexes for common query patterns (sort, filter by date)
create index if not exists idx_events_timeline_sort  on events(timeline_id, sort_index);
create index if not exists idx_events_timeline_date  on events(timeline_id, date_start);

-- Enable RLS — policies enforce device_id scoping at the database level.
-- The client must pass its device_id as a custom header or claim.
alter table timelines enable row level security;
alter table events    enable row level security;

-- ─── Timelines: only the owning device can read/write ───
-- The anon key client sets a custom request header 'x-device-id'
-- via supabase.headers or the Supabase client global headers config.
create policy "Device can read own timelines" on timelines
  for select using (
    device_id = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

create policy "Device can insert own timelines" on timelines
  for insert with check (
    device_id = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

create policy "Device can update own timelines" on timelines
  for update using (
    device_id = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

create policy "Device can delete own timelines" on timelines
  for delete using (
    device_id = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

-- ─── Events: scoped through timeline ownership ───
-- Events belong to timelines, which are scoped by device_id.
create policy "Device can read own events" on events
  for select using (
    exists (
      select 1 from timelines t
      where t.id = events.timeline_id
        and t.device_id = coalesce(
          current_setting('request.headers', true)::json->>'x-device-id',
          ''
        )
    )
  );

create policy "Device can insert own events" on events
  for insert with check (
    exists (
      select 1 from timelines t
      where t.id = events.timeline_id
        and t.device_id = coalesce(
          current_setting('request.headers', true)::json->>'x-device-id',
          ''
        )
    )
  );

create policy "Device can update own events" on events
  for update using (
    exists (
      select 1 from timelines t
      where t.id = events.timeline_id
        and t.device_id = coalesce(
          current_setting('request.headers', true)::json->>'x-device-id',
          ''
        )
    )
  );

create policy "Device can delete own events" on events
  for delete using (
    exists (
      select 1 from timelines t
      where t.id = events.timeline_id
        and t.device_id = coalesce(
          current_setting('request.headers', true)::json->>'x-device-id',
          ''
        )
    )
  );

-- =============================================================
-- Shared Timelines — public read, rate-limited insert via API
-- =============================================================

create table if not exists shared_timelines (
  id          text primary key,
  data        jsonb not null default '{}',
  meta        jsonb not null default '{}',
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_shared_timelines_expires on shared_timelines(expires_at);

alter table shared_timelines enable row level security;

-- Anyone can read a shared timeline (public links)
create policy "Anyone can read shared timelines" on shared_timelines
  for select using (true);

-- Insert is open but rate-limited at the API layer (api/share.js).
-- IMPORTANT: The anon key is exposed in the client bundle, so a determined
-- user could call Supabase directly and bypass API rate limiting. To mitigate:
--   1. Set a Supabase database function or webhook to enforce insert size limits
--   2. Or restrict inserts to the service_role key only (requires api/share.js
--      to use SUPABASE_SERVICE_ROLE_KEY instead of the anon key)
-- Option 2 is recommended — see share.js for the migration path.
create policy "Anyone can create shared timelines" on shared_timelines
  for insert with check (true);

-- =============================================================
-- Storage Policies — timeliner_photos_private bucket
-- =============================================================
-- Photos are stored at: {device_id}/{filename}
-- RLS policies scope access by matching the folder prefix to the
-- x-device-id header. Run these in the SQL Editor AFTER creating
-- the 'timeliner_photos_private' bucket in the Storage dashboard.
--
-- These policies go under "OTHER POLICIES UNDER STORAGE.OBJECTS"
-- in the Storage > Policies page.

-- Device can upload photos to their own folder
create policy "Device can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'timeliner_photos_private'
    and (storage.foldername(name))[1] = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

-- Device can read their own photos
create policy "Device can read own photos"
  on storage.objects for select
  using (
    bucket_id = 'timeliner_photos_private'
    and (storage.foldername(name))[1] = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

-- Device can update (overwrite) their own photos
create policy "Device can update own photos"
  on storage.objects for update
  using (
    bucket_id = 'timeliner_photos_private'
    and (storage.foldername(name))[1] = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );

-- Device can delete their own photos
create policy "Device can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'timeliner_photos_private'
    and (storage.foldername(name))[1] = coalesce(
      current_setting('request.headers', true)::json->>'x-device-id',
      ''
    )
  );
