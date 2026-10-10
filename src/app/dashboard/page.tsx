import { requireUser } from "@/lib/auth";
import { getCampaigns, getCreators } from "@/lib/db";
import { serverSupabase } from "@/lib/supabase/server";
import { aiConfigured } from "@/lib/config";
import { Dashboard } from "@/components/workspace/dashboard";
import { Notice } from "@/components/ui";
import type { Campaign, Creator } from "@/lib/schemas";
export const metadata = { title: "Brand workspace" };
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser(
    "/dashboard" +
      (params.campaign
        ? "?campaign=" + encodeURIComponent(params.campaign)
        : ""),
  );
  const db = await serverSupabase();
  let campaigns: Campaign[] = [],
    creators: Creator[] = [],
    savedIds: string[] = [],
    problem = "";
  try {
    const [records, catalog, bookmarks] = await Promise.all([
      getCampaigns(user.id),
      getCreators(),
      db.from("saved_creators").select("creator_id").eq("owner_id", user.id),
    ]);
    if (bookmarks.error)
      throw Error(
        "Your saved creators could not be loaded. Check the database setup.",
      );
    campaigns = records;
    creators = catalog.creators;
    savedIds = (bookmarks.data || []).map((x) => x.creator_id);
  } catch (e) {
    problem = e instanceof Error ? e.message : "Campaigns could not be loaded.";
  }
  if (problem)
    return (
      <div className="container section">
        <h1>Your workspace needs attention.</h1>
        <Notice error>{problem}</Notice>
        <p>
          Run the supplied database migration and seed, then reload this page.
        </p>
      </div>
    );
  if (params.campaign && !campaigns.some((c) => c.id === params.campaign))
    return (
      <div className="container section">
        <Notice error>This campaign was not found in your account.</Notice>
      </div>
    );
  return (
    <Dashboard
      campaigns={campaigns}
      creators={creators}
      savedIds={savedIds}
      name={String(
        user.user_metadata.display_name || user.email?.split("@")[0] || "there",
      )}
      campaignId={params.campaign}
      aiReady={aiConfigured()}
    />
  );
}
