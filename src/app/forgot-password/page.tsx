import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Art, Notice } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/config";
import { safeNext } from "@/lib/domain";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const user = await getUser();
  if (user) redirect(safeNext(params.next || null));
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
        <p className="eyebrow">BriefProof / forgot-password</p>
        <h1>Let’s get you back in.</h1>
        <p className="muted">We’ll email you a link to reset your password.</p>
        {params.notice && <Notice>{params.notice}</Notice>}
        <AuthForm
          mode="forgot-password"
          configured={supabaseConfigured()}
          next={safeNext(params.next || null)}
          initialError={params.error}
        />
      </section>
    </div>
  );
}
