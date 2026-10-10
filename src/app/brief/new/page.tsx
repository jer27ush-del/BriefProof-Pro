import { BriefBuilder } from "@/components/brief-builder";
import { requireUser } from "@/lib/auth";
import { getCreators, getCampaigns } from "@/lib/db";
import { aiConfigured } from "@/lib/config";
import { notFound } from "next/navigation";
export const metadata = { title: "Build your brief" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ creator?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.creator) query.set("creator", params.creator);
  if (params.edit) query.set("edit", params.edit);
  const user = await requireUser(
    "/brief/new" + (query.size ? "?" + query : ""),
  );
  const { creators } = await getCreators();
  const campaign = params.edit
    ? (await getCampaigns(user.id)).find((c) => c.brief.id === params.edit)
    : undefined;
  if (params.edit && !campaign) notFound();
  return (
    <BriefBuilder
      aiReady={aiConfigured()}
      creator={creators.find(
        (c) => c.id === (params.creator || campaign?.creator_id),
      )}
      existing={campaign?.brief}
    />
  );
}
