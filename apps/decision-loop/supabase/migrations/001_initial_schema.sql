-- Decision Loop: Initial Schema

-- Day entries: one per user per date
create table day_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  one_thing text,
  problem_what text,
  problem_why text,
  problem_who text,
  problem_constraints text,
  production text,
  is_locked boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unique_user_date unique (user_id, date),
  constraint locked_requires_locked_at check (
    (is_locked = false) or (is_locked = true and locked_at is not null)
  )
);

-- Decision locks: one per locked day entry
create table decision_locks (
  id uuid primary key default gen_random_uuid(),
  day_entry_id uuid not null references day_entries(id) on delete cascade,
  decision_text text not null,
  assumptions text,
  practical_change text,
  shared_with_fyrk boolean not null default false,
  share_token text,
  created_at timestamptz not null default now(),

  constraint unique_day_entry unique (day_entry_id)
);

create index idx_decision_locks_share_token on decision_locks(share_token) where share_token is not null;
create index idx_day_entries_user_date on day_entries(user_id, date);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger day_entries_updated_at
  before update on day_entries
  for each row execute function update_updated_at();

-- RLS
alter table day_entries enable row level security;
alter table decision_locks enable row level security;

-- Users can only see their own entries
create policy "Users see own entries"
  on day_entries for select
  using (auth.uid() = user_id);

create policy "Users insert own entries"
  on day_entries for insert
  with check (auth.uid() = user_id);

-- Users can only update their own unlocked entries
create policy "Users update own unlocked entries"
  on day_entries for update
  using (auth.uid() = user_id and is_locked = false);

create policy "Users delete own unlocked entries"
  on day_entries for delete
  using (auth.uid() = user_id and is_locked = false);

-- Decision locks: users see own locks
create policy "Users see own locks"
  on decision_locks for select
  using (
    exists (
      select 1 from day_entries
      where day_entries.id = decision_locks.day_entry_id
        and day_entries.user_id = auth.uid()
    )
  );

create policy "Users insert own locks"
  on decision_locks for insert
  with check (
    exists (
      select 1 from day_entries
      where day_entries.id = decision_locks.day_entry_id
        and day_entries.user_id = auth.uid()
    )
  );
