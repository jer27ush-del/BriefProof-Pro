import { NextResponse } from "next/server";
import { apiUser, jsonBody, apiError, ownedPath, HttpError } from "@/lib/http";
import { saveBriefSchema, emptyState } from "@/lib/schemas";
import type { Creator } from "@/lib/schemas";
export async function POST(req: Request) {
  try {
    const body = saveBriefSchema.parse(await jsonBody(req));
    const { db, user } = await apiUser();
    body.input.referencePaths.forEach((p) => ownedPath(p, user.id));
    if (body.input.deadline < new Date().toISOString().slice(0, 10))
      throw new HttpError(400, "Choose a deadline today or later.");
    let profile: Creator | null = null;
    if (body.creatorId) {
      const { data, error } = await db
        .from("creators")
        .select("profile")
        .eq("id", body.creatorId)
        .single();
      if (error) throw new HttpError(400, "This creator is unavailable.");
      profile = data.profile as Creator;
    }
    const { data, error } = await db.rpc("save_brief", {
      p_id: body.id || null,
      p_input: body.input,
      p_output: body.output,
      p_creator: body.creatorId,
      p_state: emptyState(profile?.passport),
    });
    if (error)
      throw new HttpError(
        400,
        "The brief could not be saved. Check your account and database setup.",
      );
    return NextResponse.json({ campaignId: data });
  } catch (e) {
    return apiError(e);
  }
}
