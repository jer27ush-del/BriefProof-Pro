import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const url = new URL(req.url),
    token_hash = url.searchParams.get("token_hash"),
    type = url.searchParams.get("type");
  if (token_hash && (type === "signup" || type === "recovery")) {
    try {
      const db = await serverSupabase();
      const { error } = await db.auth.verifyOtp({ token_hash, type });
      if (!error)
        return NextResponse.redirect(
          new URL(
            type === "recovery" ? "/reset-password" : "/dashboard",
            url.origin,
          ),
        );
    } catch {
      /* Use the error screen below. */
    }
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=This+confirmation+link+is+invalid+or+expired.",
      url.origin,
    ),
  );
}
