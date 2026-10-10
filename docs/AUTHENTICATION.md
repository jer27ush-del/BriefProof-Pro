# Supabase authentication configuration

## Database and storage

Use a new Supabase project. Run `supabase/migrations/001_briefproof.sql` once, then `supabase/seed.sql`. The migration creates user profiles, creator profiles, portfolio records, bookmarks, briefs, campaigns, milestones, evaluations, quota records and a private `campaign-assets` bucket. Seed SQL can be rerun to update the eight fictional profiles.

The browser uses the project URL and publishable key. All private tables have RLS policies comparing their ownership field with `auth.uid()`. Composite foreign keys keep briefs, campaigns and milestones within the same account. Server queries additionally filter by the authenticated user ID. No service-role key is used.

## Authentication settings

1. Enable the Email provider and email/password signup.
2. Enable **Confirm email**.
3. Set **Site URL** to `http://localhost:8081` for local development.
4. Add allowed Redirect URLs:
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/auth/callback?next=/reset-password`
   - During local development, `http://localhost:8081/**` can cover encoded callback query strings.
5. For deployment, use the exact production origin and its callback URLs. Keep `NEXT_PUBLIC_SITE_URL` consistent with the actual browser origin.
6. Configure a sender / SMTP provider suitable for real email delivery. Default Supabase test-email restrictions and quotas may prevent delivery to arbitrary recipients.

## Recommended confirmation email template

In **Authentication → Email Templates → Confirm signup**, point the link at the server token-hash route:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup"
  >Confirm your email</a
>
```

The route verifies the token using Supabase and opens the dashboard. It does not accept an arbitrary redirect destination. Signup also supplies an `emailRedirectTo` URL for the standard PKCE callback flow; use the token-hash template above for consistent cross-browser email confirmation.

## Password recovery template

In the Reset Password / Recovery template:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery"
  >Reset your password</a
>
```

The token is verified server-side, the session is established, and `/reset-password` opens. After updating the password, the client signs out and requests a fresh login. Recovery tokens are handled by Supabase, not stored in application tables.

## Test with two accounts

- Register A, confirm email, sign in and save a brief/campaign.
- Sign out. Sign in again and verify persistence.
- Request password reset, open the emailed link and set a new password.
- Register and sign in as B. A's dashboard records must be absent.
- Open A's campaign URL as B. The app must report that the campaign is not in B's account.
- Test A's record IDs through REST as B: reads must be empty and writes must not change A's records.
- Attempt reading A's private asset path as B. It must be rejected by both the application and Storage RLS.

No confirmation emails were sent during development because project credentials were not supplied.

## Session architecture

`@supabase/ssr` stores sessions in cookies. Next.js Proxy refreshes and verifies sessions using `getUser`; server pages and handlers also verify users. Redirect targets are limited to safe relative paths. Private data is never authorized only by hiding client components.

API mutations require an Origin matching `NEXT_PUBLIC_SITE_URL`, validate request size and parse JSON through Zod. The email/password fields call Supabase Auth directly, which enforces its own authentication validation and rate limits. Passwords are not persisted by BriefProof.
