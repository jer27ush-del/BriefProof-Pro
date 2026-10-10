import { notFound } from "next/navigation";
import { Profile } from "@/components/marketplace";
import { getCreators } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase/server";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { creators }, user] = await Promise.all([
    params,
    getCreators(),
    getUser(),
  ]);
  const creator = creators.find((c) => c.id === id || c.slug === id);
  if (!creator) notFound();
  let saved = false;
  if (user) {
    const db = await serverSupabase();
    const { data } = await db
      .from("saved_creators")
      .select("creator_id")
      .eq("owner_id", user.id)
      .eq("creator_id", creator.id)
      .maybeSingle();
    saved = Boolean(data);
  }
  return (
    <Profile
      creator={creator}
      authenticated={Boolean(user)}
      initialSaved={saved}
    />
  );
}
