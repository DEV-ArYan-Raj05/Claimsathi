# auth

Sign-in and onboarding. PRD §3.7, rules.md §11. Supabase Auth only — no custom auth code.

- Screens: S-02 `/login` (Google, email + password, WhatsApp OTP), `/signup`, `/forgot-password`,
  `/reset-password`; S-03 `/onboarding`; `/auth/callback` (OAuth + email-confirmation links).
- Session: `shared/lib/session.ts` — one auth listener, `isReady` gate, expired-session sign-out
  (also on any API 401), sign-out with `scope: "local"`. Email/password calls: `shared/lib/authEmail.ts`.
- Guards: `RequireAuth` (protected → `/login`, remembers `from`) and `GuestOnly` (signed in → `from`,
  onboarding or track home). UX only — data is protected by RLS / the API's JWT check.
- Profile: with Supabase on and no API yet, `profileSupabase.ts` reads/writes `profiles` (RLS, own
  row only; see `supabase/migrations`). With `VITE_API_BASE_URL` set, `/me` endpoints own it.
- Modes: no Supabase env → demo accounts (`DemoSignIn`, any 6-digit code works).
- WhatsApp updates opt-in stays locked until the number is verified, and is unticked by default.
