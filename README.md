# BriefProof — Professional Edition

**Hire AI creators based on proof, not promises.**

A Next.js App Router application with an ivory editorial design, generated portfolio imagery, real Supabase authentication and persistence, owner-scoped database policies, and server-side OpenAI services. This is the upgraded v2 project; it does not need files from the previous vanilla-JavaScript demo.

## Start here

Use **Node.js 22 or newer**. Unzip the project and open the folder containing `package.json` in VS Code.

```sh
npm ci
npm run dev
```

Keep the terminal open. Visit **http://localhost:8081** in Chrome or Edge. `START-WINDOWS.bat` installs locked dependencies if needed and starts development mode.

Public pages and the eight sample creator profiles work without credentials. **Real signup, private briefs and saved campaigns require Supabase. AI features also require an OpenAI API key.** Unconfigured features are disabled or display a clear configuration error; no fake login, database save or AI response is used.

## Connect the services

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and set its URL and **publishable** key. Never put a service-role key in this application.
3. In Supabase SQL Editor run `supabase/migrations/001_briefproof.sql`, then `supabase/seed.sql`.
4. Enable email/password login and email confirmations. Configure redirect URLs and email templates as described in [Authentication](docs/AUTHENTICATION.md).
5. Set `OPENAI_API_KEY` in `.env.local`. Set `OPENAI_MODEL` and `OPENAI_VISION_MODEL` to models your API account can access. The supplied example uses `gpt-4.1-mini`, which supports text, image input and structured outputs.
6. Set `NEXT_PUBLIC_SITE_URL` to the exact origin used in your browser, initially `http://localhost:8081`.
7. Restart the server after environment changes. For production, configure variables **before building**.

Never paste a real API key into source files, chat, browser code or a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git and is not included in the deliverable.

## What changed from v1

- Next.js, strict TypeScript, React components, Tailwind CSS, Lucide icons and Zod.
- Professional light editorial styling, responsive navigation, consistent controls and custom wordmark.
- Original AI-generated artwork and fictional portraits, bundled as optimized WebP atlases.
- Email signup, verification, login, logout, recovery and protected routes with real Supabase sessions.
- PostgreSQL records and private image storage instead of localStorage for user data.
- Actual OpenAI Responses API calls with structured parsing, authenticated access, database-backed quotas, request limits and timeouts.
- Transactional campaign creation and updates, plus optimistic locking against stale campaign edits.
- Explicit human review and evidence gaps throughout the workflow.

## Product routes

| Page                   | Route                                  | Access                       |
| ---------------------- | -------------------------------------- | ---------------------------- |
| Landing / how it works | `/` and `/#how-it-works`               | Public                       |
| Discovery              | `/discover`                            | Public; bookmarks need login |
| Creator profile        | `/creators/maya-chen` and seven others | Public                       |
| Brief studio           | `/brief/new`                           | Authenticated                |
| Dashboard              | `/dashboard`                           | Authenticated                |
| Campaign workspace     | `/dashboard?campaign=<uuid>`           | Owner only                   |
| Registration / sign-in | `/signup`, `/login`                    | Public                       |
| Password recovery      | `/forgot-password`, `/reset-password`  | Recovery flow                |
| Auth callbacks         | `/auth/callback`, `/auth/confirm`      | Verified links               |
| Setup / policies       | `/setup`, `/policies`                  | Public                       |

Campaign views: Overview, Brief, Creators, Brand Consistency, LicenseGuard, Milestones and Final Delivery.

## Three-minute demo after configuration

1. Register and confirm your email, then sign in.
2. Open Brief Studio; choose **Use Aurelle example** and move through the four steps.
3. Generate a real AI brief, edit a section, and save it to your account.
4. Open **Find & compare creators**; use metadata matching or AI profile matching, then compare up to three creators.
5. Return to the campaign's Creators view and select a collaborator. Their declared production passport is copied into the campaign.
6. Upload a reference and campaign frames, run vision review and record human decisions.
7. Review production declarations in LicenseGuard. Acknowledge unresolved information and mark the information reviewed.
8. Generate or manually add milestones, edit the plan, then **Save changes**.
9. Review the final checklist. Acceptance requires a creator, reviewed frames, a reviewed passport and acknowledgements of unresolved passport items.
10. Sign out and back in; your campaign is reloaded from Supabase.

## Real calculations, AI and sample content

- **Metadata matching:** configurable weighted style/capability/deliverable/workflow/evidence scoring, with separate budget and availability constraints. Style-description-only matching is explicitly tag based.
- **AI matching:** ranks only database creator IDs and may cite only that creator's supplied portfolio IDs. Generated reasoning is still a model suggestion.
- **Brief and follow-up questions:** real server-side text generation. Manual brief editing is separately labeled.
- **Creator evaluation:** reviews declared profile evidence against a brief; it is not an actual visual audition score.
- **Brand Consistency:** real vision-model observations when configured. It does not promise exact packaging, logo or color verification.
- **LicenseGuard:** deterministic missing/ambiguous-field checks plus optional real LLM review. No license verification or legal clearance is claimed.
- **Milestones:** AI proposals with dates constrained to the campaign window, and a fully editable manual alternative.
- **Sample creators:** names, portraits, work, prices, availability and experience are fictional. They are not live marketplace inventory.

Reference images in discovery are a local preview only. Brief-generation calls use written direction; uploaded assets are analyzed through the separate Brand Consistency action.

## Project organization

- `src/app/` — pages, auth callbacks, protected API route handlers
- `src/components/` — navigation, marketplace, authentication and brief studio
- `src/components/workspace/` — dashboard, campaign, reviews and milestones
- `src/lib/supabase/` — browser and server clients
- `src/lib/ai/service.ts` — seven separate OpenAI feature functions
- `src/lib/schemas.ts` — input, output and persisted-data validation
- `src/lib/domain.ts` — ranking, acceptance and redirect rules
- `src/data/creators.ts` — fictional starter profiles and portfolio metadata
- `supabase/` — schema, policies, transactional functions and seed SQL
- `public/art/` — bundled artwork
- `tests/` — validation, domain and ownership regression checks
- `scripts/` — seed generator and production HTTP smoke checks

## Checks and production build

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

After building, `node scripts/smoke.mjs` starts an isolated local server with services disabled and checks public routes, protected redirects and API error handling. It does not test your real accounts. See [Testing](docs/TESTING.md) for the verification record and live-service checklist.

## Deployment

See [Deployment](docs/DEPLOYMENT.md). The application supports Vercel's standard Next.js runtime and a normal Node server. Configure environment variables before deployment; update Supabase redirect URLs to the deployment origin.

## Important limits

This is an implemented, configurable hackathon product—not a claim of a fully operated production marketplace. Live email delivery, actual Supabase account isolation and real OpenAI responses must be validated against your own configured services. No payment processing, binding contracts, real creator messaging or production moderation system is included.

Private images are limited to 2 MB each and four frames per campaign. AI request quota is 10 per minute and 100 per day per user. Provider billing limits still apply. Deleted campaigns cascade through their relational records; previously uploaded storage objects require operator cleanup. Comparison IDs alone use sessionStorage; private project data does not.

The AI model name is configurable. Provider availability, pricing and account access can change. Set spend limits in your API project and confirm consent before submitting third-party assets.
#   B r i e f P r o o f - P r o  
 