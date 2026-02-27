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

-- Disable RLS (no auth — data is scoped by device_id in queries)
alter table timelines enable row level security;
alter table events    enable row level security;

-- Permissive policies so the anon key can read/write everything.
-- Security is provided by device_id filtering in application code.
create policy "Allow all on timelines" on timelines
  for all using (true) with check (true);

create policy "Allow all on events" on events
  for all using (true) with check (true);
