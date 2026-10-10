import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, jsonBody, apiError, HttpError, ownedPath } from "@/lib/http";
import { aiConfigured } from "@/lib/config";
import {
  briefInputSchema,
  briefOutputSchema,
  campaignStateSchema,
} from "@/lib/schemas";
import type { Creator } from "@/lib/schemas";
import * as ai from "@/lib/ai/service";
export const runtime = "nodejs";
export const maxDuration = 60;
const inputSchema = z.object({
  input: briefInputSchema.optional(),
  campaignId: z.uuid().optional(),
  creatorId: z.uuid().optional(),
  section: z.string().max(100).optional(),
});
export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> },
) {
  try {
    const action = z
      .enum([
        "brief",
        "questions",
        "match",
        "evaluate",
        "milestones",
        "consistency",
        "license",
      ])
      .parse((await ctx.params).action);
    const b = inputSchema.parse(await jsonBody(req));
    const { db, user } = await apiUser();
    if (!aiConfigured())
      throw new HttpError(
        503,
        "AI is not configured. Add OPENAI_API_KEY to the server environment.",
      );
    const { data: allowed, error: limitError } =
      await db.rpc("consume_ai_quota");
    if (limitError)
      throw new HttpError(
        503,
        "AI rate-limit setup is missing. Run the database migration.",
      );
    if (!allowed)
      throw new HttpError(429, "Your AI request limit was reached. Try later.");
    if (action === "brief" || action === "questions") {
      const input = briefInputSchema.parse(b.input);
      input.referencePaths.forEach((p) => ownedPath(p, user.id));
      const result =
        action === "brief"
          ? await ai.generateBrief(input, b.section)
          : await ai.generateFollowUpQuestions(input);
      return NextResponse.json({ result });
    }
    if (!b.campaignId)
      throw new HttpError(400, "Save a campaign before using this action.");
    const { data: c, error } = await db
      .from("campaigns")
      .select("*,brief:briefs(*)")
      .eq("id", b.campaignId)
      .eq("owner_id", user.id)
      .single();
    if (error || !c) throw new HttpError(404, "Campaign not found.");
    const input = briefInputSchema.parse(c.brief.input),
      state = campaignStateSchema.parse(c.state);
    let result: unknown;
    if (action === "match") {
      const { data: rows, error: ce } = await db
        .from("creators")
        .select("profile");
      if (ce) throw new HttpError(503, "Creator data is unavailable.");
      result = await ai.matchCreators(
        input,
        rows.map((x) => x.profile as Creator),
      );
    }
    if (action === "evaluate") {
      const creatorId = b.creatorId || c.creator_id;
      if (!creatorId) throw new HttpError(400, "Choose a creator to evaluate.");
      const { data: cr, error: ce } = await db
        .from("creators")
        .select("profile")
        .eq("id", creatorId)
        .single();
      if (ce) throw new HttpError(404, "Creator not found.");
      result = await ai.evaluateCreatorAgainstBrief(
        input,
        cr.profile as Creator,
      );
      const { error: saveError } = await db
        .from("creator_evaluations")
        .insert({
          owner_id: user.id,
          campaign_id: c.id,
          creator_id: creatorId,
          result,
        });
      if (saveError)
        throw new HttpError(
          503,
          "AI evaluation completed but could not be saved.",
        );
    }
    if (action === "milestones")
      result = await ai.generateMilestones(
        input,
        c.brief.output ? briefOutputSchema.parse(c.brief.output) : null,
      );
    if (action === "license")
      result = await ai.reviewLicenseChecklist(state.passport, input);
    if (action === "consistency") {
      if (!state.referencePath || !state.frames.length)
        throw new HttpError(
          400,
          "Upload a brand reference and at least one campaign frame, then save changes.",
        );
      const paths = [state.referencePath, ...state.frames.map((f) => f.path)];
      const images: string[] = [];
      for (const path of paths) {
        ownedPath(path, user.id);
        const { data: blob, error: de } = await db.storage
          .from("campaign-assets")
          .download(path);
        if (de || !blob)
          throw new HttpError(404, "A campaign image could not be loaded.");
        if (
          blob.size > 2097152 ||
          !["image/jpeg", "image/png", "image/webp"].includes(blob.type)
        )
          throw new HttpError(400, "Unsupported campaign image.");
        images.push(
          `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`,
        );
      }
      const observations = await ai.analyzeBrandConsistency(input, images);
      if (observations.observations.some((o) => o.frame > state.frames.length))
        throw new HttpError(
          502,
          "The model referenced a frame that was not supplied.",
        );
      result = observations;
    }
    return NextResponse.json(
      { result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
