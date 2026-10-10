import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sampleCreators } from "../src/data/creators";
import {
  briefInputSchema,
  briefOutputSchema,
  campaignStateSchema,
  emptyState,
  exampleInput,
  saveBriefSchema,
} from "../src/lib/schemas";
import {
  rankCreators,
  passportFindings,
  acceptanceErrors,
  safeNext,
} from "../src/lib/domain";
test("eight distinct sample creators with linked portfolio evidence", () => {
  assert.equal(sampleCreators.length, 8);
  assert.equal(new Set(sampleCreators.map((c) => c.id)).size, 8);
  assert.equal(
    new Set(sampleCreators.flatMap((c) => c.portfolio.map((p) => p.id))).size,
    16,
  );
});
test("Aurelle example passes all required brief fields", () => {
  assert.ok(briefInputSchema.safeParse(exampleInput()).success);
});
test("negative budgets, invalid dates and empty deliverables rejected", () => {
  for (const patch of [
    { budget: -1 },
    { deadline: "2030-02-31" },
    { deliverables: [] },
    { revisions: 11 },
    { idea: "" },
  ])
    assert.equal(
      briefInputSchema.safeParse({ ...exampleInput(), ...patch }).success,
      false,
    );
});
test("untrusted ownership cannot be supplied through brief save schema", () => {
  const result = saveBriefSchema.parse({
    input: exampleInput(),
    output: null,
    creatorId: null,
    owner_id: "attacker",
  });
  assert.equal("owner_id" in result, false);
});
test("brief output does not accept malformed responses", () => {
  assert.equal(
    briefOutputSchema.safeParse({ objective: "Nice" }).success,
    false,
  );
});
test("matching enforces budget and availability separately from score", () => {
  const ranked = rankCreators(sampleCreators, exampleInput());
  const noah = ranked.find((x) => x.creator.slug === "noah-williams")!;
  assert.equal(noah.eligible, false);
  assert.ok(noah.constraints.includes("Above stated budget"));
  assert.ok(noah.constraints.includes("Availability requires confirmation"));
  assert.ok(ranked[0].eligible);
});
test("match explanations cite actual overlapping style tags", () => {
  for (const r of rankCreators(sampleCreators, exampleInput())) {
    assert.ok(r.score >= 0 && r.score <= 100);
    for (const tag of r.tags) assert.ok(r.creator.styles.includes(tag));
  }
});
test("production checklist surfaces missing and ambiguous permissions", () => {
  const state = emptyState(sampleCreators[0].passport);
  assert.ok(passportFindings(state.passport).some((f) => f.key === "music"));
  assert.ok(
    passportFindings(state.passport).some((f) => f.key === "brandPermissions"),
  );
});
test("acceptance rejects unreviewed campaigns", () => {
  const state = emptyState();
  assert.ok(acceptanceErrors(state, null).length >= 4);
});
test("acknowledged human-reviewed campaign can record acceptance", () => {
  const state = emptyState(sampleCreators[0].passport);
  state.frames = [
    {
      id: "20000000-0000-4000-8000-000000000001",
      path: "owner/frame.jpg",
      name: "Frame",
      note: "Checked",
      status: "Acknowledged",
    },
  ];
  state.passportReviewed = true;
  state.acknowledged = passportFindings(state.passport).map((x) => x.key);
  state.checklist = {
    received: true,
    format: true,
    consistency: true,
    usage: true,
    revisions: true,
  };
  assert.deepEqual(acceptanceErrors(state, sampleCreators[0].id), []);
  assert.ok(campaignStateSchema.safeParse(state).success);
});
test("external and protocol-relative auth redirects blocked", () => {
  for (const url of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\nlocation",
  ])
    assert.equal(safeNext(url), "/dashboard");
  assert.equal(safeNext("/brief/new?creator=123"), "/brief/new?creator=123");
});
test("all private tables enable RLS and owner checks are present", () => {
  const sql = readFileSync("supabase/migrations/001_briefproof.sql", "utf8");
  for (const table of [
    "profiles",
    "saved_creators",
    "briefs",
    "campaigns",
    "campaign_milestones",
    "creator_evaluations",
    "ai_usage",
  ])
    assert.ok(
      sql.includes(`alter table public.${table} enable row level security`),
    );
  assert.ok(sql.includes("foreign key(brief_id,owner_id)"));
  assert.ok(sql.includes("foreign key(campaign_id,owner_id)"));
  assert.ok(sql.includes("Version conflict"));
  assert.ok(sql.includes("daily_count<=100 and minute_count<=10"));
});
test("all seven real AI service functions are implemented server-side", () => {
  const s = readFileSync("src/lib/ai/service.ts", "utf8");
  for (const fn of [
    "generateBrief",
    "generateFollowUpQuestions",
    "matchCreators",
    "evaluateCreatorAgainstBrief",
    "generateMilestones",
    "analyzeBrandConsistency",
    "reviewLicenseChecklist",
  ])
    assert.ok(s.includes(`function ${fn}(`));
  assert.ok(s.includes("client.responses.parse"));
  assert.match(s, /import ['"]server-only['"]/);
});
test("public environment example does not contain a secret key", () => {
  const env = readFileSync(".env.example", "utf8");
  assert.doesNotMatch(env, /NEXT_PUBLIC_OPENAI_API_KEY/);
  assert.doesNotMatch(env, /sk-[A-Za-z0-9]{20,}/);
  assert.ok(readFileSync(".gitignore", "utf8").includes(".env*"));
});
