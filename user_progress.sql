-- Create user_progress table
create table public.user_progress (
  user_id uuid not null references auth.users on delete cascade,
  last_question_index int4 not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id)
);

-- Check if RLS is enabled on other tables to decide if we need it here.
-- Usually good practice to enable RLS.
alter table public.user_progress enable row level security;

-- Create policies
create policy "Users can translate their own progress"
  on public.user_progress for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Grant access to authenticated users
grant all on public.user_progress to authenticated;
grant all on public.user_progress to service_role;
