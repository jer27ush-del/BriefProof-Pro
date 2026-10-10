import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { supabaseConfigured, aiConfigured } from "@/lib/config";
import { Notice } from "@/components/ui";
export const metadata = { title: "Setup guide" };
export default function Setup() {
  return (
    <div className="container section setup-content">
      <p className="eyebrow">From local project to connected product</p>
      <h1>
        A few connections.
        <br />
        <em>A complete workspace.</em>
      </h1>
      <p className="body-large muted">
        Explore sample creators immediately. Connect your own Supabase and
        OpenAI accounts to enable private projects and AI features.
      </p>
      <Notice>
        Configuration detected: Supabase{" "}
        {supabaseConfigured() ? "configured" : "not configured"} · AI{" "}
        {aiConfigured() ? "configured" : "not configured"}. These indicators do
        not verify service connectivity.
      </Notice>
      <h2>1. Run the project</h2>
      <p>Install Node.js 22 or newer. In the project folder:</p>
      <pre>
        <code>{"npm install\nnpm run dev"}</code>
      </pre>
      <p>
        Keep the terminal running and open <code>http://localhost:8081</code>.
        If localhost fails, try <code>http://127.0.0.1:8081</code> and update
        the configured site URL to match.
      </p>
      <h2>2. Connect Supabase</h2>
      <ol>
        <li>
          Create a Supabase project. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>.
        </li>
        <li>
          Set the project URL and publishable key. Do not use a service-role
          key.
        </li>
        <li>
          Run <code>supabase/migrations/001_briefproof.sql</code>, then{" "}
          <code>supabase/seed.sql</code> in the SQL editor.
        </li>
        <li>
          Enable email/password authentication and email confirmations. Add your
          site URL and callback routes to the redirect allowlist.
        </li>
        <li>
          Follow <code>docs/AUTHENTICATION.md</code> for confirmation and
          recovery email templates.
        </li>
      </ol>
      <h2>3. Connect AI</h2>
      <p>
        Set <code>OPENAI_API_KEY</code> only on the server. Configure{" "}
        <code>OPENAI_MODEL</code> and <code>OPENAI_VISION_MODEL</code> with
        models your API account can access. Restart the development server after
        changing environment variables.
      </p>
      <p>
        No secret is requested in this page or stored in your browser. AI
        actions make real API calls; provider failures are shown without
        fabricated results.
      </p>
      <h2>4. Verify your account flow</h2>
      <p>
        Register, confirm your email, create a brief, save a campaign and check
        persistence after signing out and back in. Test password recovery and a
        second account to confirm private data stays separate.
      </p>
      <div className="actions">
        <Link href="/signup" className="button primary">
          Create your account <ArrowUpRight size={17} />
        </Link>
        <Link href="/discover" className="button outline">
          Explore sample creators
        </Link>
      </div>
    </div>
  );
}
