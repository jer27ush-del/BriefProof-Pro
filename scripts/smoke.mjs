import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const port = 38941,
  origin = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      OPENAI_API_KEY: "",
      NEXT_PUBLIC_SITE_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
child.stdout.on("data", (d) => (logs += d));
child.stderr.on("data", (d) => (logs += d));
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null)
      throw Error("Server exited before startup: " + logs);
    try {
      const r = await fetch(origin);
      if (r.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, "Server did not become ready.");
  for (const path of [
    "/",
    "/discover",
    "/creators/maya-chen",
    "/login",
    "/signup",
    "/forgot-password",
    "/setup",
    "/policies",
  ]) {
    const res = await fetch(origin + path);
    assert.equal(res.status, 200, path);
    assert.match(await res.text(), /briefproof/i);
    console.log("PASS", path);
  }
  for (const path of ["/dashboard", "/brief/new", "/reset-password"]) {
    const res = await fetch(origin + path, { redirect: "manual" });
    assert.equal(res.status, 307, path);
    assert.equal(
      new URL(res.headers.get("location"), origin).pathname,
      "/login",
    );
    console.log("PASS protected redirect", path);
  }
  const noAuth = await fetch(origin + "/api/bookmarks");
  assert.equal(noAuth.status, 503);
  console.log("PASS missing-service API error");
  const denied = await fetch(origin + "/api/briefs", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(denied.status, 403);
  console.log("PASS cross-origin mutation blocked");
  const invalid = await fetch(origin + "/api/briefs", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(invalid.status, 400);
  console.log("PASS invalid input rejected");
  console.log("14 production HTTP checks passed.");
} finally {
  child.kill("SIGTERM");
}
