alter table projects enable row level security;
alter table test_cases enable row level security;
alter table results enable row level security;
alter table screenshots enable row level security;

-- Admin-authored tables: only the owning admin can read/write via an authenticated session.
create policy "admin owns projects" on projects
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "admin manages own test cases" on test_cases
  for all using (
    exists (select 1 from projects p where p.id = test_cases.project_id and p.created_by = auth.uid())
  ) with check (
    exists (select 1 from projects p where p.id = test_cases.project_id and p.created_by = auth.uid())
  );

-- results/screenshots have no anon/authenticated client policy at all: the tester-facing
-- API routes use the service-role client (src/lib/supabase/service.ts), which bypasses RLS
-- entirely and is the ONLY place column-level restriction (status-only for testers) is enforced.
create policy "admin reads own results" on results
  for select using (
    exists (
      select 1 from test_cases tc join projects p on p.id = tc.project_id
      where tc.id = results.test_case_id and p.created_by = auth.uid()
    )
  );

create policy "admin reads own screenshots" on screenshots
  for select using (
    exists (
      select 1 from results r
      join test_cases tc on tc.id = r.test_case_id
      join projects p on p.id = tc.project_id
      where r.id = screenshots.result_id and p.created_by = auth.uid()
    )
  );
