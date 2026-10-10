import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, jsonBody, apiError, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const { db, user } = await apiUser();
    const { data, error } = await db
      .from("saved_creators")
      .select("creator_id")
      .eq("owner_id", user.id);
    if (error) throw new HttpError(503, "Saved creators could not be loaded.");
    return NextResponse.json({ ids: data.map((x) => x.creator_id) });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    const b = z
      .object({ creatorId: z.uuid(), saved: z.boolean() })
      .parse(await jsonBody(req));
    const { db, user } = await apiUser();
    const result = b.saved
      ? await db
          .from("saved_creators")
          .upsert({ owner_id: user.id, creator_id: b.creatorId })
      : await db
          .from("saved_creators")
          .delete()
          .eq("owner_id", user.id)
          .eq("creator_id", b.creatorId);
    if (result.error) throw new HttpError(400, "Bookmark could not be saved.");
    return NextResponse.json({ saved: b.saved });
  } catch (e) {
    return apiError(e);
  }
}
