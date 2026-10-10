export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT") &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.includes("YOUR_"),
  );
}
export function aiConfigured() {
  return Boolean(
    process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("YOUR_"),
  );
}
