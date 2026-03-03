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
