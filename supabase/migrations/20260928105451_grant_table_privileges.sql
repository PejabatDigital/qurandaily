-- This project didn't come with the default anon/authenticated table grants
-- that Supabase normally provisions on new projects, so every request was
-- rejected with "permission denied for table ..." before RLS was even
-- evaluated. Grant the same operations the RLS policies already restrict
-- per-row, matching what each table's policies allow.

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_logs TO anon, authenticated;
