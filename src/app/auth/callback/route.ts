import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/domain";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const db = await serverSupabase();
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    } catch {
      /* Configuration error is shown on the login page. */
    }
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=The+email+link+expired+or+could+not+be+verified.+Please+request+a+new+link.",
      url.origin,
    ),
  );
}
