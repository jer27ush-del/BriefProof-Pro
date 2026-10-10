import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverSupabase } from "./supabase/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiUser() {
  let db;
  try {
    db = await serverSupabase();
  } catch {
    throw new HttpError(
      503,
      "Account services are not configured. Follow README setup.",
    );
  }
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, "Please sign in to continue.");
  return { db, user };
}
export function checkOrigin(req: Request) {
  const expected = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8081",
  ).origin;
  if (req.headers.get("origin") !== expected)
    throw new HttpError(
      403,
      "Request origin is not allowed. Check NEXT_PUBLIC_SITE_URL.",
    );
}
export async function boundedBytes(req: Request, max = 100_000) {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > max) throw new HttpError(413, "This request is too large.");
  if (!req.body) throw new HttpError(400, "Request body is required.");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "This request is too large.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    all.set(chunk, at);
    at += chunk.length;
  }
  return all;
}
export async function jsonBody(req: Request, max = 100_000): Promise<unknown> {
  checkOrigin(req);
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Send JSON data.");
  try {
    return JSON.parse(new TextDecoder().decode(await boundedBytes(req, max)));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Invalid JSON request.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 3)
          .join("; "),
      },
      { status: 400 },
    );
  return NextResponse.json(
    { error: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}
export function ownedPath(path: string, userId: string) {
  if (
    !path.startsWith(userId + "/") ||
    path.includes("..") ||
    !/^[-a-zA-Z0-9_/.]+$/.test(path)
  )
    throw new HttpError(403, "Asset does not belong to this account.");
  return path;
}
