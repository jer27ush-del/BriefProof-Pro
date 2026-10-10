import { AuthForm } from "@/components/auth-form";
import { Art, Notice } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/config";
import { safeNext } from "@/lib/domain";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  await requireUser("/reset-password");
  return (
    <div className="container auth-layout">
      <div className="auth-visual">
        <Art index={0} />
        <div>
          <p className="eyebrow">The next chapter of creative work</p>
          <h2>
            Good things happen
            <br />
            with the right people.
          </h2>
        </div>
      </div>
      <section className="auth-content">
        <p className="eyebrow">BriefProof / reset-password</p>
        <h1>A fresh start.</h1>
        <p className="muted">Choose a new password for your account.</p>
        {params.notice && <Notice>{params.notice}</Notice>}
        <AuthForm
          mode="reset-password"
          configured={supabaseConfigured()}
          next={safeNext(params.next || null)}
          initialError={params.error}
        />
      </section>
    </div>
  );
}
