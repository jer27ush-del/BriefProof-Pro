# Deployment

## Vercel

1. Put this folder's contents in a private Git repository or import it as the project root.
2. Select the **Next.js** framework preset and Node.js 22 or newer.
3. Install with `npm ci`; build with `npm run build`. Leave output-directory defaults unchanged.
4. Add the environment variables shown in `.env.example` before building. `OPENAI_API_KEY` must stay server-only.
5. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin. Make sure Supabase Site URL, callback allowlist and email templates use that origin.
6. Run the SQL migration and seed in the Supabase project's SQL editor.
7. Deploy and run the live-service acceptance checklist in `TESTING.md`.

AI handlers use the Node runtime, a 45-second provider timeout, no automatic retries and a 60-second route duration setting. Your hosting plan must permit the required execution time. An OpenAI call consumes API credits only when configured and invoked.

## Node hosting

```sh
npm ci
npm run build
npm start
```

The supplied start command listens on `127.0.0.1:8081`. For a container/reverse-proxy deployment, use:

```sh
npx next start --hostname 0.0.0.0 --port 3000
```

Configure HTTPS at the reverse proxy and set the canonical origin accordingly. Do not put the app behind a cache that shares authenticated HTML or session cookies between users.

## Operations before real customer use

- Enable Supabase backups and monitor API, database and storage spend.
- Set OpenAI project budget/usage limits.
- Configure SMTP and verify deliverability.
- Add production abuse controls such as signup protection/CAPTCHA as appropriate to your traffic.
- Schedule cleanup of unreferenced storage objects and old `ai_usage` quota windows using administrator credentials outside the application.
- Define a privacy/retention policy, support contact and account-deletion process.
- Keep dependencies updated and repeat ownership, auth and recovery tests after changes.

No deployment or third-party service provisioning was performed as part of the ZIP deliverable.
