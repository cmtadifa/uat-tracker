-- Admin auth is now a shared password + signed cookie, not Supabase Auth --
-- there is no auth.uid() to key RLS policies off anymore. All four tables
-- keep RLS enabled with zero policies (default-deny for anon/authenticated;
-- the service-role client, used by every route now, bypasses RLS entirely).
-- Enforcement is 100% in the API route layer (requireAdminSession() /
-- verifyTesterSession()).
drop policy if exists "admin owns projects" on projects;
drop policy if exists "admin manages own test cases" on test_cases;
drop policy if exists "admin reads own results" on results;
drop policy if exists "admin reads own screenshots" on screenshots;

alter table projects drop column created_by;
