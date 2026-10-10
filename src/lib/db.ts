import "server-only";
import { serverSupabase } from "./supabase/server";
import { supabaseConfigured } from "./config";
import { sampleCreators } from "@/data/creators";
import type { Creator, Campaign } from "./schemas";
import {
  briefInputSchema,
  briefOutputSchema,
  campaignStateSchema,
  milestoneSchema,
} from "./schemas";
export async function getCreators(): Promise<{
  creators: Creator[];
  source: "database" | "sample";
  error?: string;
}> {
  if (!supabaseConfigured())
    return { creators: sampleCreators, source: "sample" };
  const db = await serverSupabase();
  const { data, error } = await db
    .from("creators")
    .select("profile")
    .order("sort_order");
  if (error)
    return {
      creators: sampleCreators,
      source: "sample",
      error:
        "The creator database is unavailable. Showing bundled sample profiles.",
    };
  if (!data?.length)
    return {
      creators: sampleCreators,
      source: "sample",
      error:
        "Run supabase/seed.sql to load these sample profiles into the database.",
    };
  return {
    creators: data.map((row) => row.profile as Creator),
    source: "database",
  };
}
export async function getCampaigns(userId: string): Promise<Campaign[]> {
  const db = await serverSupabase();
  const { data, error } = await db
    .from("campaigns")
    .select("*, brief:briefs(*), milestones:campaign_milestones(*)")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error)
    throw Error(
      "Campaigns could not be loaded. Check your connection and database setup.",
    );
  return (data || []).map((row) => ({
    ...row,
    brief: {
      ...row.brief,
      input: briefInputSchema.parse(row.brief.input),
      output: row.brief.output
        ? briefOutputSchema.parse(row.brief.output)
        : null,
    },
    state: campaignStateSchema.parse(row.state),
    milestones: (row.milestones || []).map((m: { payload: unknown }) =>
      milestoneSchema.parse(m.payload),
    ),
  })) as Campaign[];
}
