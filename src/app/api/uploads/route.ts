import { NextResponse } from "next/server";
import {
  apiUser,
  apiError,
  HttpError,
  checkOrigin,
  boundedBytes,
  ownedPath,
} from "@/lib/http";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { db, user } = await apiUser();
    const bytes = await boundedBytes(req, 2200000);
    const form = await new Response(bytes, {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2097152)
      throw new HttpError(400, "Choose an image under 2 MB.");
    const ext: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (!ext[file.type]) throw new HttpError(400, "Use JPEG, PNG or WebP.");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const valid =
      file.type === "image/jpeg"
        ? buffer[0] === 255 && buffer[1] === 216
        : file.type === "image/png"
          ? buffer[0] === 137 &&
            buffer[1] === 80 &&
            buffer[2] === 78 &&
            buffer[3] === 71
          : String.fromCharCode(...buffer.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...buffer.slice(8, 12)) === "WEBP";
    if (!valid) throw new HttpError(400, "The image file is invalid.");
    const path = `${user.id}/${crypto.randomUUID()}.${ext[file.type]}`;
    const { error } = await db.storage
      .from("campaign-assets")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error)
      throw new HttpError(
        400,
        "Upload failed. Check the private storage bucket setup.",
      );
    return NextResponse.json({ path });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET(req: Request) {
  try {
    const { db, user } = await apiUser();
    const path = ownedPath(
      new URL(req.url).searchParams.get("path") || "",
      user.id,
    );
    const { data, error } = await db.storage
      .from("campaign-assets")
      .createSignedUrl(path, 300);
    if (error) throw new HttpError(404, "Image is unavailable.");
    return NextResponse.json(
      { url: data.signedUrl },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
