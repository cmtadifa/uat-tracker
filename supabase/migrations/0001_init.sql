create extension if not exists "pgcrypto";

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_token uuid not null default gen_random_uuid() unique,
  invite_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table test_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  steps text[] not null default '{}',
  expected_result text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table results (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid not null unique references test_cases(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'passed', 'failed')),
  tester_name text,
  fail_reason text,
  updated_at timestamptz not null default now(),
  constraint fail_reason_required_when_failed check (
    status <> 'failed' or (fail_reason is not null and length(trim(fail_reason)) > 0)
  )
);

create table screenshots (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references results(id) on delete cascade,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index idx_test_cases_project_id on test_cases(project_id);
create index idx_screenshots_result_id on screenshots(result_id);

-- Every test case gets a results row at creation time (status starts not_started).
create or replace function create_result_for_test_case()
returns trigger as $$
begin
  insert into results (test_case_id, status) values (new.id, 'not_started');
  return new;
end;
$$ language plpgsql;

create trigger trg_create_result_for_test_case
  after insert on test_cases
  for each row execute function create_result_for_test_case();
