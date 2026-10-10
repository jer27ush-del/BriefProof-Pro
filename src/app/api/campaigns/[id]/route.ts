import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiUser,
  jsonBody,
  apiError,
  HttpError,
  checkOrigin,
  ownedPath,
} from "@/lib/http";
import { campaignPatchSchema, campaignStateSchema } from "@/lib/schemas";
import type { Creator } from "@/lib/schemas";
import { acceptanceErrors } from "@/lib/domain";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, ctx: Context) {
  try {
    const id = z.uuid().parse((await ctx.params).id),
      patch = campaignPatchSchema.parse(await jsonBody(req, 180000));
    const { db, user } = await apiUser();
    const { data: c, error } = await db
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (error || !c) throw new HttpError(404, "Campaign not found.");
    let state = patch.state || campaignStateSchema.parse(c.state);
    const selected =
      patch.creatorId === undefined ? c.creator_id : patch.creatorId;
    if (selected && selected !== c.creator_id) {
      const { data: cr, error: ce } = await db
        .from("creators")
        .select("profile")
        .eq("id", selected)
        .single();
      if (ce) throw new HttpError(400, "Creator not found.");
      state = {
        ...state,
        passport: (cr.profile as Creator).passport,
        passportReviewed: false,
        acknowledged: [],
        licenseReview: null,
        evaluation: null,
        acceptedAt: null,
      };
    }
    [
      ...state.frames.map((f) => f.path),
      ...(state.referencePath ? [state.referencePath] : []),
    ].forEach((p) => ownedPath(p, user.id));
    const wantsAcceptance = patch.status === "Completed";
    if (wantsAcceptance) {
      const errors = acceptanceErrors(state, selected);
      if (errors.length) throw new HttpError(400, errors.join(" "));
      state.acceptedAt = new Date().toISOString();
    } else state.acceptedAt = null;
    const status = wantsAcceptance
      ? "Completed"
      : patch.status || (c.status === "Completed" ? "In Review" : c.status);
    const { data: version, error: se } = await db.rpc("save_campaign", {
      p_id: id,
      p_version: patch.version,
      p_status: status,
      p_creator: selected,
      p_state: state,
      p_milestones: patch.milestones || null,
    });
    if (se)
      throw new HttpError(
        se.message.includes("Version conflict") ? 409 : 400,
        se.message.includes("Version conflict")
          ? "This campaign changed in another tab. Reload before saving."
          : "Campaign changes could not be saved.",
      );
    return NextResponse.json({
      updated_at: version,
      state,
      status,
      creator_id: selected,
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    checkOrigin(req);
    const id = z.uuid().parse((await ctx.params).id);
    const { db, user } = await apiUser();
    const { data: c, error } = await db
      .from("campaigns")
      .select("brief_id")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (error || !c) throw new HttpError(404, "Campaign not found.");
    const { error: de } = await db
      .from("briefs")
      .delete()
      .eq("id", c.brief_id)
      .eq("owner_id", user.id);
    if (de) throw new HttpError(400, "Campaign could not be deleted.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
