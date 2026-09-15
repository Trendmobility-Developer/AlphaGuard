-- AlphaGuard multi-tenant schema.
-- Run once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

-- ── Tenants ──────────────────────────────────────────────────────────────

create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- One row per Supabase Auth user; links them to an organization.
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  org_id     uuid not null references organizations (id) on delete cascade,
  full_name  text,
  role       text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

-- A gate / location within an org. Each has its own API key for scanner devices.
create table if not exists sites (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations (id) on delete cascade,
  name         text not null,
  api_key      text not null unique,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ── Access-control sessions ─────────────────────────────────────────────

create table if not exists sessions (
  id             text primary key,        -- client-generated UUID (matches the Android app's session id)
  org_id         uuid not null references organizations (id) on delete cascade,
  site_id        uuid references sites (id) on delete set null,
  device_name    text,
  session_type   text not null check (session_type in ('CAR', 'PEDESTRIAN')),
  driver_name    text,
  id_number      text,
  license_number text,
  license_valid  boolean,
  license_expiry text,
  nationality    text,
  gender         text,
  date_of_birth  text,
  vehicle_reg    text,
  vehicle_make   text,
  vehicle_vin    text,
  vehicle_color  text,
  vehicle_weight text,
  disk_expiry    text,
  disk_valid     boolean,
  check_in_time  bigint not null,          -- epoch ms, set by the device
  check_out_time bigint,
  duration_ms    bigint,
  status         text not null check (status in ('IN_PROGRESS', 'COMPLETED')),
  flagged        boolean not null default false,
  photo_path     text,                     -- storage object path, e.g. "<org_id>/<session_id>.png"
  updated_at     timestamptz not null default now()
);

create index if not exists idx_sessions_org_checkin on sessions (org_id, check_in_time desc);
create index if not exists idx_sessions_org_status   on sessions (org_id, status);
create index if not exists idx_sessions_org_idnumber on sessions (org_id, id_number);

-- ── Signup -> auto-create an organization + owner profile ───────────────
-- Pass { data: { org_name, full_name } } to supabase.auth.signUp().

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name)
    values (coalesce(new.raw_user_meta_data ->> 'org_name', 'My Organization'))
    returning id into new_org_id;

  insert into profiles (id, org_id, full_name, role)
    values (new.id, new_org_id, new.raw_user_meta_data ->> 'full_name', 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Row Level Security ───────────────────────────────────────────────────
-- Dashboard users only ever see their own org's data. Scanner devices never
-- authenticate as a Supabase user at all — they hit /api/v1/* with a site
-- API key, which the server verifies and then writes with the service_role
-- key (which bypasses RLS entirely). Photos are served the same way, via a
-- server route, so no storage policies are needed either.

alter table organizations enable row level security;
alter table profiles      enable row level security;
alter table sites         enable row level security;
alter table sessions      enable row level security;

create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from profiles where id = auth.uid()
$$;

create policy "org_select" on organizations
  for select using (id = auth_org_id());

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "sites_select" on sites
  for select using (org_id = auth_org_id());
create policy "sites_insert" on sites
  for insert with check (org_id = auth_org_id());
create policy "sites_update" on sites
  for update using (org_id = auth_org_id());
create policy "sites_delete" on sites
  for delete using (org_id = auth_org_id());

create policy "sessions_select" on sessions
  for select using (org_id = auth_org_id());
create policy "sessions_update" on sessions
  for update using (org_id = auth_org_id());

-- Live dashboard updates: broadcast row changes to subscribed clients.
-- Postgres Changes respects the same RLS policies above, so each dashboard
-- only ever hears about rows in its own org.
alter publication supabase_realtime add table sessions;

-- Private bucket for licence/ID photos. Only ever touched server-side
-- (service_role for writes, the /api/photo/[id] route for reads) so it
-- carries no public or per-user storage policies.
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', false)
  on conflict (id) do nothing;
