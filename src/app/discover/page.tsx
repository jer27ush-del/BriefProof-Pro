import { Discovery } from "@/components/marketplace";
import { getCreators, getCampaigns } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase/server";
import { aiConfigured } from "@/lib/config";
export const metadata = { title: "Discover creators" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const [{ creators, error }, user, params] = await Promise.all([
    getCreators(),
    getUser(),
    searchParams,
  ]);
  let ids: string[] = [];
  let campaign;
  if (user) {
    const db = await serverSupabase();
    const { data } = await db
      .from("saved_creators")
      .select("creator_id")
      .eq("owner_id", user.id);
    ids = (data || []).map((x) => x.creator_id);
    if (params.campaign)
      campaign = (await getCampaigns(user.id)).find(
        (c) => c.id === params.campaign,
      );
  }
  return (
    <Discovery
      creators={creators}
      sourceError={error}
      authenticated={Boolean(user)}
      savedIds={ids}
      campaignId={campaign?.id}
      brief={campaign?.brief.input}
      aiReady={aiConfigured()}
    />
  );
}
