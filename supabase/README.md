# supabase

SQL migrations for the Supabase project (Supabase CLI layout). Apply in filename order.

| Migration | What it does |
|---|---|
| `20261124090000_auth_profiles_reviewed.sql` | `profiles` table (one row per auth user, created by a trigger on sign-up), RLS so a user reads/edits/deletes only their own row, column grants so `email`, `phone` and WhatsApp verification can't be set from the browser, and two RPCs: `ensure_my_profile()`, `confirm_my_whatsapp(p_phone)`. Re-runnable. |

Apply: Supabase dashboard → SQL Editor → paste the file → Run, or `supabase db push` with the CLI.

Claims, policies and documents tables (PRD §6.1) aren't here yet: the backend owns them
(rules.md §8, Alembic). Every user-owned table must follow the same pattern: `user_id uuid not null
references auth.users on delete cascade`, RLS enabled, policies on `(select auth.uid()) = user_id`.
TODO(rules.md §8): decide whether Supabase SQL migrations or Alembic is the single migration tool.
