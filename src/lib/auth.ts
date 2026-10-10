import "server-only";
import { redirect } from "next/navigation";
import { serverSupabase } from "./supabase/server";
import { supabaseConfigured } from "./config";
export async function getUser() {
  if (!supabaseConfigured()) return null;
  const db = await serverSupabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  return error ? null : user;
}
export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect("/login?next=" + encodeURIComponent(next));
  return user;
}
