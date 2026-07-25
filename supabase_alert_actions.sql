-- Actionable alerts (Pillar C — close the loop).
-- Append-only log of the actions a user takes on a threat alert: acknowledge,
-- take ownership, add a note, resolve. The latest row is the alert's current state.
-- Run this in the Supabase SQL editor.

create table if not exists public.alert_actions (
  id                uuid primary key default gen_random_uuid(),
  notification_id   uuid not null,
  user_id           uuid,
  status            text not null check (status in ('acknowledged','in_progress','resolved','reopened')),
  assignee          text,
  note              text,
  created_at        timestamptz not null default now()
);

-- Fast "latest action for this alert" lookups.
create index if not exists alert_actions_notification_idx
  on public.alert_actions (notification_id, created_at desc);

-- Row Level Security: a user can only see/write their own alert actions.
alter table public.alert_actions enable row level security;

drop policy if exists "alert_actions_owner_all" on public.alert_actions;
create policy "alert_actions_owner_all"
  on public.alert_actions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
