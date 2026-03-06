-- Books: store metadata + chapters/pages as JSONB (avoids complex relational schema for content)
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  author text,
  file_type text not null check (file_type in ('epub', 'pdf')),
  total_chapters integer not null default 0,
  total_pages integer not null default 0,
  total_characters integer not null default 0,
  chapters jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table books enable row level security;
create policy "Users manage own books" on books
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index books_user_id_idx on books (user_id);

-- Reading progress
create table reading_progress (
  book_id uuid primary key references books(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  chapter_index integer not null default 0,
  page_index integer not null default 0,
  char_offset integer not null default 0,
  completed_pages integer not null default 0,
  last_typed_at timestamptz
);

alter table reading_progress enable row level security;
create policy "Users manage own progress" on reading_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index reading_progress_user_id_idx on reading_progress (user_id);

-- Typing sessions
create table typing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  book_id uuid not null references books(id) on delete cascade,
  book_title text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  total_characters_typed integer not null,
  correct_characters integer not null,
  incorrect_characters integer not null,
  avg_wpm real not null,
  peak_wpm real not null,
  accuracy real not null,
  wpm_samples jsonb not null default '[]'::jsonb
);

alter table typing_sessions enable row level security;
create policy "Users manage own sessions" on typing_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index typing_sessions_user_id_idx on typing_sessions (user_id);
create index typing_sessions_book_id_idx on typing_sessions (book_id);
create index typing_sessions_started_at_idx on typing_sessions (user_id, started_at desc);

-- Keystroke stats (aggregate per user per character)
create table keystroke_stats (
  user_id uuid not null default auth.uid(),
  character text not null,
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  incorrect_attempts integer not null default 0,
  primary key (user_id, character)
);

alter table keystroke_stats enable row level security;
create policy "Users manage own keystroke stats" on keystroke_stats
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
