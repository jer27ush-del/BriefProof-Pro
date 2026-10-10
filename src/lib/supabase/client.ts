"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfigured } from "@/lib/config";
export function browserSupabase() {
  if (!supabaseConfigured())
    throw Error("Account services are not configured yet.");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
