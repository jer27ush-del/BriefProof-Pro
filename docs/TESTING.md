# Verification and service acceptance

## Local verification

The delivery was checked with Node.js and locked dependencies:

- Strict TypeScript compilation and ESLint.
- Optimized Next.js production build.
- 15 automated tests covering schemas, ranking, acceptance, redirect handling, AI wiring and PostgreSQL policies.
- 14 production HTTP checks covering public routes, immediate protected redirects, configuration errors, cross-origin mutation rejection and invalid input.

The database test runs the delivered migration and seed in PGlite (embedded PostgreSQL), using simulated Supabase auth and storage schemas and two independent user identities. It exercises actual row-level policies, private asset isolation, transactional save, stale version rejection, quotas and anonymous access. Only the pgcrypto extension declaration is omitted in this harness; PostgreSQL's built-in UUID generator is used. This is not a test against a hosted Supabase account.

Run:

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:smoke
```

No live Supabase/OpenAI credentials were provided. Email delivery, hosted authentication, hosted storage and actual paid model responses have not been end-to-end verified. Visual browser/device testing also remains to be completed.

## Before launching with real accounts

1. Configure environment variables and migrate/seed a fresh Supabase project.
2. Register account A, verify its email, sign in, sign out and complete password recovery.
3. Create and reload a campaign; upload a valid reference and frames. Confirm a public storage URL cannot read private assets.
4. Register account B. Confirm B cannot list, read, edit or delete A's campaigns or access A's image paths, including by directly invoking API endpoints.
5. Exercise all seven AI actions with your allowed models. Confirm structured outputs and evidence citations; inspect timeout and quota errors. Never treat generated license observations as verified permissions.
6. Select a creator, review frames and passport fields, acknowledge findings, edit milestones and complete final acceptance. Refresh to confirm persistence.
7. Edit a campaign in two tabs and verify the stale tab gets a conflict instead of overwriting the newer save.
8. Check navigation, comparison dialog, forms, keyboard focus and narrow-screen layouts in current desktop/mobile browsers.
9. Test HTTPS deployment with its exact configured origin and real email redirect URLs.

A successful build is not a substitute for these live integration and visual checks.
