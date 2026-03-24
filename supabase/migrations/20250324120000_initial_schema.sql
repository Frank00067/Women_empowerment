-- Rise Digital — initial schema with RLS
-- Apply via Supabase Dashboard → SQL (new project) or: supabase db push

create extension if not exists "pgcrypto";

-- ── profiles (1:1 with auth.users) ─────────────────────────────────────────
-- NOTE: Table must exist before any function body references public.profiles.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('learner', 'employer', 'admin')),
  headline text not null default '',
  bio text not null default '',
  phone text not null default '',
  location text not null default '',
  skills jsonb not null default '[]'::jsonb,
  cv_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (lower(email));

-- ── Helper functions (RLS-safe; must come after profiles table) ────────────
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

create or replace function public.profile_role(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = uid limit 1;
$$;

-- New Supabase user → profile (public signup: learner | employer only)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(new.raw_user_meta_data ->> 'role', 'learner');
  if r not in ('learner', 'employer') then
    r := 'learner';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    r
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Learners / employers cannot escalate role; only admins may change roles
create or replace function public.profiles_enforce_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    raise exception 'Only an admin may change role';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_before_update
  before update on public.profiles
  for each row
  execute procedure public.profiles_enforce_role();

-- ── courses & lessons ───────────────────────────────────────────────────────
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  content text not null,
  sort_order int not null default 0
);

create index lessons_course_idx on public.lessons (course_id);

-- ── progress & certificates ────────────────────────────────────────────────
create table public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index progress_user_idx on public.progress (user_id);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- Issue certificate + learner notifications when all lessons in a course are done
create or replace function public.check_course_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c_id uuid;
  course_title text;
  total int;
  done int;
  cert_id uuid;
begin
  select l.course_id into c_id from public.lessons l where l.id = new.lesson_id;
  if c_id is null then
    return new;
  end if;

  select c.title into course_title from public.courses c where c.id = c_id;
  select count(*)::int into total from public.lessons where course_id = c_id;
  select count(*)::int into done
  from public.progress p
  join public.lessons l on l.id = p.lesson_id
  where p.user_id = new.user_id and l.course_id = c_id;

  if done >= total and total > 0 then
    insert into public.certificates (user_id, course_id)
    values (new.user_id, c_id)
    on conflict (user_id, course_id) do nothing
    returning id into cert_id;

    if cert_id is not null then
      insert into public.notifications (user_id, kind, title, message, meta) values
        (
          new.user_id,
          'certificate_issued',
          'Certificate earned',
          format('You completed "%s". Your certificate is ready.', course_title),
          jsonb_build_object('course_id', c_id::text, 'certificate_id', cert_id::text)
        ),
        (
          new.user_id,
          'course_completed',
          'Course completed',
          format('Congratulations on finishing "%s"!', course_title),
          jsonb_build_object('course_id', c_id::text)
        );
    end if;
  end if;

  return new;
end;
$$;

create trigger tr_progress_completion
  after insert on public.progress
  for each row
  execute procedure public.check_course_completion();

-- ── jobs & applications ──────────────────────────────────────────────────────
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users (id) on delete cascade,
  employer_display_name text not null default '',
  title text not null,
  description text not null,
  location text not null default '',
  salary text not null default '',
  created_at timestamptz not null default now()
);

create index jobs_employer_idx on public.jobs (employer_id);

-- Denormalized for public job board (avoids exposing full profiles to anonymous readers)
create or replace function public.jobs_set_employer_display()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(full_name, '') into new.employer_display_name
  from public.profiles where id = new.employer_id;
  return new;
end;
$$;

create trigger tr_jobs_employer_display
  before insert on public.jobs
  for each row
  execute procedure public.jobs_set_employer_display();

create or replace function public.jobs_refresh_employer_display()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.employer_id is distinct from old.employer_id then
    select coalesce(full_name, '') into new.employer_display_name
    from public.profiles where id = new.employer_id;
  end if;
  return new;
end;
$$;

create trigger tr_jobs_employer_display_update
  before update on public.jobs
  for each row
  execute procedure public.jobs_refresh_employer_display();

create or replace function public.notify_learners_new_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, kind, title, message, meta)
  select
    p.id,
    'job_posted',
    'New job opportunity',
    new.title || ' — check the jobs board.',
    jsonb_build_object('job_id', new.id::text)
  from public.profiles p
  where p.role = 'learner';

  return new;
end;
$$;

create trigger tr_jobs_notify_learners
  after insert on public.jobs
  for each row
  execute procedure public.notify_learners_new_job();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  learner_id uuid not null references auth.users (id) on delete cascade,
  cover_letter text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'shortlisted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (job_id, learner_id)
);

create index applications_job_idx on public.applications (job_id);
create index applications_learner_idx on public.applications (learner_id);

create or replace function public.notify_application_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  j record;
  learner_name text;
begin
  select * into j from public.jobs where id = new.job_id;
  select full_name into learner_name from public.profiles where id = new.learner_id;

  insert into public.notifications (user_id, kind, title, message, meta) values
    (
      j.employer_id,
      'application_received',
      'New application',
      coalesce(learner_name, 'A learner') || ' applied to "' || j.title || '".',
      jsonb_build_object('application_id', new.id::text, 'job_id', new.job_id::text)
    ),
    (
      new.learner_id,
      'application_status',
      'Application sent',
      'Your application for "' || j.title || '" was submitted.',
      jsonb_build_object('application_id', new.id::text, 'job_id', new.job_id::text)
    );

  return new;
end;
$$;

create trigger tr_applications_notify
  after insert on public.applications
  for each row
  execute procedure public.notify_application_submitted();

create or replace function public.notify_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  j record;
begin
  if new.status is distinct from old.status then
    select * into j from public.jobs where id = new.job_id;
    insert into public.notifications (user_id, kind, title, message, meta)
    values (
      new.learner_id,
      'application_status',
      'Application updated',
      format('Your application for "%s" is now: %s.', j.title, new.status),
      jsonb_build_object('application_id', new.id::text, 'job_id', new.job_id::text)
    );
  end if;
  return new;
end;
$$;

create trigger tr_applications_status
  after update on public.applications
  for each row
  execute procedure public.notify_application_status_change();

-- ── resources & notifications ───────────────────────────────────────────────
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('pdf', 'link', 'video')),
  url text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.resources enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy profiles_select on public.profiles
  for select using (
    auth.uid() = id
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.learner_id = profiles.id and j.employer_id = auth.uid()
    )
  );

create policy profiles_update on public.profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

-- courses / lessons: public read; admin write
create policy courses_select on public.courses for select using (true);

create policy courses_insert on public.courses
  for insert with check (public.is_admin(auth.uid()));

create policy courses_update on public.courses
  for update using (public.is_admin(auth.uid()));

create policy courses_delete on public.courses
  for delete using (public.is_admin(auth.uid()));

create policy lessons_select on public.lessons for select using (true);

create policy lessons_insert on public.lessons
  for insert with check (public.is_admin(auth.uid()));

create policy lessons_update on public.lessons
  for update using (public.is_admin(auth.uid()));

create policy lessons_delete on public.lessons
  for delete using (public.is_admin(auth.uid()));

-- progress
create policy progress_select on public.progress
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy progress_insert on public.progress
  for insert with check (
    auth.uid() = user_id
    and public.profile_role(auth.uid()) = 'learner'
  );

-- certificates
create policy certificates_select on public.certificates
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- jobs
create policy jobs_select on public.jobs for select using (true);

create policy jobs_insert on public.jobs
  for insert with check (
    auth.uid() = employer_id
    and public.profile_role(auth.uid()) = 'employer'
  );

create policy jobs_delete on public.jobs
  for delete using (auth.uid() = employer_id or public.is_admin(auth.uid()));

-- applications
create policy applications_select on public.applications
  for select using (
    public.is_admin(auth.uid())
    or auth.uid() = learner_id
    or exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and j.employer_id = auth.uid()
    )
  );

create policy applications_insert on public.applications
  for insert with check (
    auth.uid() = learner_id
    and public.profile_role(auth.uid()) = 'learner'
  );

create policy applications_update on public.applications
  for update using (
    exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and j.employer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and j.employer_id = auth.uid()
    )
  );

-- resources
create policy resources_select on public.resources for select using (true);

create policy resources_insert on public.resources
  for insert with check (public.is_admin(auth.uid()));

create policy resources_update on public.resources
  for update using (public.is_admin(auth.uid()));

create policy resources_delete on public.resources
  for delete using (public.is_admin(auth.uid()));

-- notifications (rows created only via SECURITY DEFINER triggers / functions)
create policy notifications_select on public.notifications
  for select using (auth.uid() = user_id);

create policy notifications_update on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
