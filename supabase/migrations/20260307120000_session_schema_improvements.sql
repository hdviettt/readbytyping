-- Add chapter/page tracking to typing sessions for per-chapter analytics
alter table typing_sessions
  add column chapter_index integer,
  add column page_index integer;

-- Preserve session history when a book is deleted (set null instead of cascade)
alter table typing_sessions
  drop constraint typing_sessions_book_id_fkey,
  add constraint typing_sessions_book_id_fkey
    foreign key (book_id) references books(id) on delete set null;

-- book_id must now be nullable for set null to work
alter table typing_sessions
  alter column book_id drop not null;
