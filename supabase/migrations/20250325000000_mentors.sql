-- Mentors table and mentorship requests

create table public.mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  expertise text not null,
  bio text not null default '',
  contact_email text not null default '',
  created_at timestamptz not null default now()
);

create table public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  message text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (learner_id, mentor_id)
);

create index mentorship_requests_learner_idx on public.mentorship_requests (learner_id);
create index mentorship_requests_mentor_idx on public.mentorship_requests (mentor_id);

alter table public.mentors enable row level security;
alter table public.mentorship_requests enable row level security;

-- Anyone can read mentors
create policy mentors_select on public.mentors for select using (true);
create policy mentors_insert on public.mentors for insert with check (public.is_admin(auth.uid()));
create policy mentors_delete on public.mentors for delete using (public.is_admin(auth.uid()));

-- Learners manage their own requests; admins read all
create policy mentorship_requests_select on public.mentorship_requests
  for select using (auth.uid() = learner_id or public.is_admin(auth.uid()));

create policy mentorship_requests_insert on public.mentorship_requests
  for insert with check (
    auth.uid() = learner_id
    and public.profile_role(auth.uid()) = 'learner'
  );

create policy mentorship_requests_delete on public.mentorship_requests
  for delete using (auth.uid() = learner_id);

-- Seed demo mentors
insert into public.mentors (name, expertise, bio, contact_email) values
  ('Amara Diallo', 'Digital Marketing', 'Senior digital marketer with 10 years experience across West Africa.', 'amara@demo.com'),
  ('Fatima Nkosi', 'Software Engineering', 'Full-stack engineer and coding bootcamp instructor based in Nairobi.', 'fatima@demo.com'),
  ('Grace Mensah', 'Entrepreneurship', 'Founder of two successful SMEs; mentor at ALU and Ashoka.', 'grace@demo.com');
