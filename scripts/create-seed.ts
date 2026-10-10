import { writeFileSync } from "node:fs";
import { sampleCreators } from "../src/data/creators";
const quote = (value: unknown) =>
  "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
const rows = sampleCreators.map(
  (c, i) => `('${c.id}','${c.slug}',${quote(c)},${i})`,
);
const portfolio = sampleCreators.flatMap((c) =>
  c.portfolio.map((p) => `('${p.id}','${c.id}',${quote(p)})`),
);
writeFileSync(
  "supabase/seed.sql",
  `-- Fictional demo profiles. Run after the migration.\nbegin;\ninsert into public.creators(id,slug,profile,sort_order) values\n${rows.join(",\n")}\non conflict(id) do update set profile=excluded.profile,slug=excluded.slug,sort_order=excluded.sort_order;\ninsert into public.creator_portfolio_items(id,creator_id,metadata) values\n${portfolio.join(",\n")}\non conflict(id) do update set metadata=excluded.metadata;\ncommit;\n`,
);
console.log(
  "Seed SQL written: eight fictional creators and sixteen portfolio records.",
);
