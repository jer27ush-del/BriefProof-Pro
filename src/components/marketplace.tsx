"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Bookmark,
  Plus,
  Check,
  X,
  Sparkles,
  Upload,
  ArrowRight,
} from "lucide-react";
import type { Creator, BriefInput, MatchOutput } from "@/lib/schemas";
import { rankCreators, inr } from "@/lib/domain";
import { sampleCreators } from "@/data/creators";
import {
  Button,
  Field,
  Notice,
  Portrait,
  Art,
  Tags,
  useToast,
  request,
  message,
} from "./ui";
import { CreatorCard } from "./creator-card";
function useComparison() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const value = JSON.parse(
        sessionStorage.getItem("briefproof.comparison") || "[]",
      );
      if (Array.isArray(value))
        setIds(value.filter((x) => typeof x === "string").slice(0, 3));
    } catch {
      /* An invalid comparison starts empty. */
    }
  }, []);
  function change(next: string[]) {
    setIds(next);
    try {
      sessionStorage.setItem("briefproof.comparison", JSON.stringify(next));
    } catch {
      /* Comparison remains available in memory. */
    }
  }
  return { ids, change };
}
function ComparisonDialog({
  creators,
  close,
  brief,
}: {
  creators: Creator[];
  close: () => void;
  brief?: BriefInput;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const criteria: [string, (c: Creator) => string][] = [
    ["Creative direction", (c) => c.styles.join(", ")],
    ["Specialty", (c) => c.specialty],
    ["Deliverables", (c) => c.deliverables.join(", ")],
    ["Starting price", (c) => inr(c.price) + " (sample)"],
    [
      "Availability",
      (c) =>
        c.available ? "Available; confirm dates" : "Requires confirmation",
    ],
    ["Tools", (c) => c.tools.join(", ")],
    ["Workflow evidence", (c) => c.passport.evidence],
    ["Usage information", (c) => c.passport.commercialUsage],
    ...(brief
      ? [
          [
            "Campaign fit",
            (c: Creator) => {
              const r = rankCreators([c], brief)[0];
              return `${r.score}% metadata fit. ${r.constraints.join("; ")}`;
            },
          ] as [string, (c: Creator) => string],
        ]
      : []),
  ];
  return (
    <dialog
      ref={ref}
      className="compare-dialog"
      onCancel={close}
      onClose={close}
    >
      <div className="row">
        <div>
          <p className="eyebrow">Make an informed shortlist</p>
          <h2>Compare your creators.</h2>
        </div>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close comparison"
        >
          <X />
        </button>
      </div>
      <p className="muted">
        Declared sample data. Missing documentation is a question to resolve,
        not a judgment of talent.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>What matters</th>
              {creators.map((c) => (
                <th key={c.id}>
                  <Portrait creator={c} />
                  <h3>{c.name}</h3>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map(([name, value]) => (
              <tr key={name}>
                <th>{name}</th>
                {creators.map((c) => (
                  <td key={c.id}>{value(c)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th>Next step</th>
              {creators.map((c) => (
                <td key={c.id}>
                  <Link
                    className="text-link"
                    href={"/brief/new?creator=" + c.id}
                  >
                    Start a project <ArrowUpRight size={15} />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </dialog>
  );
}
export function Discovery({
  creators,
  authenticated,
  savedIds,
  brief,
  campaignId,
  aiReady,
  sourceError,
}: {
  creators: Creator[];
  authenticated: boolean;
  savedIds: string[];
  brief?: BriefInput;
  campaignId?: string;
  aiReady: boolean;
  sourceError?: string;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [style, setStyle] = useState(""),
    [maxBudget, setMaxBudget] = useState(""),
    [available, setAvailable] = useState(false),
    [experience, setExperience] = useState(""),
    [sort, setSort] = useState("relevance"),
    [direction, setDirection] = useState(""),
    [reference, setReference] = useState(""),
    [saved, setSaved] = useState(savedIds),
    [busy, setBusy] = useState(false),
    [aiMatches, setAiMatches] = useState<MatchOutput | null>(null),
    [compareOpen, setCompareOpen] = useState(false);
  const comparison = useComparison(),
    toast = useToast(),
    router = useRouter();
  useEffect(
    () => () => {
      if (reference) URL.revokeObjectURL(reference);
    },
    [reference],
  );
  const ranked = useMemo(() => {
    const input = brief
      ? { ...brief, style: brief.style + " " + direction }
      : null;
    return input
      ? rankCreators(creators, input)
      : creators.map((c) => ({
          creator: c,
          score: direction
            ? Math.round(
                (c.styles.filter((s) =>
                  direction.toLowerCase().includes(s.toLowerCase()),
                ).length /
                  c.styles.length) *
                  100,
              )
            : undefined,
          explanation: direction ? "Exact written-style tag overlap." : "",
          constraints: [],
        }));
  }, [brief, direction, creators]);
  let results = ranked.filter(
    ({ creator: c }) =>
      (
        c.name +
        " " +
        c.specialty +
        " " +
        c.tools.join(" ") +
        " " +
        c.styles.join(" ")
      )
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!category || c.category === category) &&
      (!style || c.styles.includes(style)) &&
      (!maxBudget || c.price <= Number(maxBudget)) &&
      (!available || c.available) &&
      (!experience || c.experience >= Number(experience)),
  );
  if (sort === "relevance" && direction && !brief && !aiMatches)
    results = [...results].sort((a, b) => (b.score || 0) - (a.score || 0));
  if (sort === "price")
    results = [...results].sort((a, b) => a.creator.price - b.creator.price);
  if (sort === "experience")
    results = [...results].sort(
      (a, b) => b.creator.experience - a.creator.experience,
    );
  if (sort === "relevance" && aiMatches) {
    const order = new Map(aiMatches.matches.map((m, i) => [m.creatorId, i]));
    results = [...results].sort(
      (a, b) =>
        (order.get(a.creator.id) ?? 99) - (order.get(b.creator.id) ?? 99),
    );
  }
  async function save(id: string) {
    if (!authenticated) {
      router.push("/login?next=/discover");
      return;
    }
    try {
      const next = !saved.includes(id);
      await request("/api/bookmarks", { creatorId: id, saved: next });
      setSaved(next ? [...saved, id] : saved.filter((x) => x !== id));
      toast(
        next
          ? "Creator saved to your workspace."
          : "Creator removed from saved list.",
      );
    } catch (e) {
      toast(message(e), true);
    }
  }
  function toggle(id: string) {
    if (comparison.ids.includes(id))
      comparison.change(comparison.ids.filter((x) => x !== id));
    else if (comparison.ids.length === 3)
      toast("Compare up to three creators. Remove one first.", true);
    else comparison.change([...comparison.ids, id]);
  }
  async function aiMatch() {
    setBusy(true);
    try {
      const data = await request<{ result: MatchOutput }>("/api/ai/match", {
        campaignId,
      });
      setAiMatches(data.result);
      toast("AI explanations generated from supplied creator profiles.");
    } catch (e) {
      toast(message(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container discovery-page">
      <div className="page-heading">
        <p className="eyebrow">Find your creative counterpart</p>
        <h1>
          Different minds.
          <br />
          <em>Exceptional possibilities.</em>
        </h1>
        <p>
          Explore independent AI filmmakers, image makers and creative
          technologists.
        </p>
      </div>
      {sourceError && <Notice>{sourceError}</Notice>}
      <div className="discovery-search">
        <Search size={21} />
        <input
          aria-label="Search creators"
          placeholder="Search creators, specialties, tools, or styles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="sample-label">8 sample profiles</span>
      </div>
      <details className="direction-search" open={Boolean(brief)}>
        <summary>
          <Sparkles size={17} /> Have a visual direction? Find your creative DNA
          match <Plus size={16} />
        </summary>
        <div className="direction-grid">
          <Field
            label="Describe the look and feel"
            hint="Written tags drive the basic match. The reference is a preview, not image analysis."
          >
            {(id) => (
              <textarea
                id={id}
                placeholder="Warm, minimalist skincare film. Natural textures, quiet movement…"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              />
            )}
          </Field>
          <div>
            <label className="upload-tile">
              <Upload size={20} />
              <span>Add a reference image</span>
              <small>JPG, PNG, WebP · up to 2 MB</small>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      f.type,
                    ) ||
                    f.size > 2097152
                  ) {
                    toast("Choose a JPEG, PNG or WebP under 2 MB.", true);
                    return;
                  }
                  setReference(URL.createObjectURL(f));
                }}
              />
            </label>
            {reference && (
              <div
                className="reference-preview"
                style={{ backgroundImage: `url(${reference})` }}
                role="img"
                aria-label="Your reference preview"
              />
            )}
          </div>
        </div>
        <div className="row">
          <p className="muted small">
            {brief
              ? `Matching your campaign: ${brief.name}`
              : "For campaign-aware matching, save a brief first."}
          </p>
          {campaignId ? (
            <Button
              variant="primary small"
              pending={busy}
              disabled={!aiReady}
              onClick={aiMatch}
            >
              <Sparkles size={15} /> AI profile matching
            </Button>
          ) : (
            <Link className="text-link" href="/brief/new">
              Build a brief <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
        {campaignId && !aiReady && (
          <p className="small muted">
            AI matching needs OPENAI_API_KEY on the server. Metadata matching is
            available.
          </p>
        )}
      </details>
      <div className="marketplace-layout">
        <aside className="filter-panel">
          <h3>
            <SlidersHorizontal size={17} /> Refine your search
          </h3>
          <Field label="Creative specialty">
            {(id) => (
              <select
                id={id}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All specialties</option>
                {[...new Set(creators.map((c) => c.category))].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Visual style">
            {(id) => (
              <select
                id={id}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="">All styles</option>
                {[...new Set(creators.flatMap((c) => c.styles))]
                  .sort()
                  .map((t) => (
                    <option key={t}>{t}</option>
                  ))}
              </select>
            )}
          </Field>
          <Field label="Maximum starting price">
            {(id) => (
              <select
                id={id}
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              >
                <option value="">Any budget</option>
                <option value="7000">Up to ₹7,000</option>
                <option value="10000">Up to ₹10,000</option>
                <option value="15000">Up to ₹15,000</option>
              </select>
            )}
          </Field>
          <Field label="Experience">
            {(id) => (
              <select
                id={id}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="">Any experience</option>
                <option value="4">4+ years</option>
                <option value="6">6+ years</option>
              </select>
            )}
          </Field>
          <label className="check-label">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />{" "}
            Available for projects
          </label>
          <Button
            variant="ghost small"
            onClick={() => {
              setQuery("");
              setCategory("");
              setStyle("");
              setMaxBudget("");
              setAvailable(false);
              setExperience("");
            }}
          >
            Clear filters
          </Button>
          <p className="filter-note">
            All profiles, experience and prices are fictional sample data.
            Confirm scope and commercial terms directly.
          </p>
        </aside>
        <section>
          <div className="results-heading">
            <span>
              <strong>{results.length}</strong> creators for your next idea
            </span>
            <select
              aria-label="Sort creators"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="relevance">Sort: relevance</option>
              <option value="price">Starting price: low to high</option>
              <option value="experience">Experience: high to low</option>
            </select>
          </div>
          {brief && (
            <p className="small muted">
              Metadata weights: style 35%, capability 25%, deliverables 20%,
              workflow 10%, supplied evidence 10%. Budget, availability and
              deliverables are shown separately as constraints.
            </p>
          )}
          <div className="creator-grid discovery-grid">
            {results.map((r) => (
              <CreatorCard
                key={r.creator.id}
                creator={r.creator}
                saved={saved.includes(r.creator.id)}
                compared={comparison.ids.includes(r.creator.id)}
                onSave={() => save(r.creator.id)}
                onCompare={() => toggle(r.creator.id)}
                score={r.score}
                reason={
                  (aiMatches?.matches.find((m) => m.creatorId === r.creator.id)
                    ?.reason || r.explanation) +
                  " " +
                  r.constraints.join("; ")
                }
              />
            ))}
          </div>
          {!results.length && (
            <div className="empty-state">
              <Search size={30} />
              <h3>No exact match, yet.</h3>
              <p>Try a broader style, a higher budget or fewer filters.</p>
            </div>
          )}
        </section>
      </div>
      {comparison.ids.length > 0 && (
        <div className="comparison-tray">
          <div>
            <strong>{comparison.ids.length} / 3 creators</strong>
            <span>
              {comparison.ids
                .map(
                  (id) => creators.find((c) => c.id === id)?.name.split(" ")[0],
                )
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <div className="actions">
            <Button variant="ghost small" onClick={() => comparison.change([])}>
              Clear
            </Button>
            <Button
              variant="primary small"
              onClick={() => setCompareOpen(true)}
            >
              Compare shortlist <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}
      {compareOpen && (
        <ComparisonDialog
          creators={creators.filter((c) => comparison.ids.includes(c.id))}
          close={() => setCompareOpen(false)}
          brief={brief}
        />
      )}
    </div>
  );
}
export function Profile({
  creator: c,
  authenticated,
  initialSaved,
}: {
  creator: Creator;
  authenticated: boolean;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved),
    [busy, setBusy] = useState(false),
    [compareOpen, setCompareOpen] = useState(false);
  const comparison = useComparison(),
    toast = useToast(),
    router = useRouter();
  async function save() {
    if (!authenticated) {
      router.push("/login?next=" + encodeURIComponent("/creators/" + c.slug));
      return;
    }
    setBusy(true);
    try {
      await request("/api/bookmarks", { creatorId: c.id, saved: !saved });
      setSaved(!saved);
      toast(saved ? "Creator removed." : "Creator saved.");
    } catch (e) {
      toast(message(e), true);
    } finally {
      setBusy(false);
    }
  }
  function compare() {
    if (!comparison.ids.includes(c.id)) {
      if (comparison.ids.length === 3)
        return toast(
          "Your shortlist already has three creators. Update it in discovery.",
          true,
        );
      comparison.change([...comparison.ids, c.id]);
    }
    setCompareOpen(true);
  }
  return (
    <div className="container profile-page">
      <Link href="/discover" className="back-link">
        ← Back to discovery
      </Link>
      <div className="profile-heading">
        <div className="identity">
          <Portrait creator={c} large />
          <div>
            <p className="eyebrow">
              {c.category} / {c.location}
            </p>
            <h1>{c.name}</h1>
            <p className="body-large">{c.specialty}</p>
            <span className={c.available ? "availability" : "muted"}>
              {c.available
                ? "Available for new projects"
                : "Enquire about availability"}
            </span>
          </div>
        </div>
        <div className="actions">
          <Button variant="outline" onClick={save} pending={busy}>
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save creator"}
          </Button>
          <Button variant="outline" onClick={compare}>
            <Plus size={17} /> Compare
          </Button>
          <Link href={"/brief/new?creator=" + c.id} className="button primary">
            Start a project <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="profile-layout">
        <div>
          <Art
            index={c.art}
            className="profile-hero"
            label={c.portfolio[0].title}
          />
          <div className="section-heading compact">
            <h2>Selected work</h2>
            <span className="sample-label">
              Concept portfolio / sample data
            </span>
          </div>
          <div className="portfolio-grid">
            {c.portfolio.map((p) => (
              <details className="portfolio-item" key={p.id}>
                <summary>
                  <Art index={p.art} />
                  <div className="row">
                    <h3>{p.title}</h3>
                    <Plus size={16} />
                  </div>
                  <p>{p.format}</p>
                </summary>
                <p>{p.description}</p>
                <p>
                  <strong>Workflow:</strong> {c.passport.workflow}
                </p>
                <p>
                  <strong>Sources:</strong> {c.passport.sources}
                </p>
                <p className="small muted">
                  Creator-declared sample information. No independent
                  verification.
                </p>
              </details>
            ))}
          </div>
          <section className="profile-about">
            <p className="eyebrow">A little about the approach</p>
            <h2>
              Considered work.
              <br />A transparent process.
            </h2>
            <p className="body-large">{c.bio}</p>
            <p>{c.passport.workflow}</p>
            <p className="muted">{c.passport.humanEdits}</p>
          </section>
        </div>
        <aside className="profile-sidebar">
          <div className="pricing-panel">
            <p className="eyebrow">Indicative project pricing</p>
            <h2>
              {inr(c.price)}
              <small> / from</small>
            </h2>
            <p>
              Typical turnaround: {c.turnaround} days
              <br />
              {c.experience} years of experience, sample profile
            </p>
            <hr />
            <h3>Creative styles</h3>
            <Tags items={c.styles} />
            <h3>Industries</h3>
            <p>{c.industries.join(" / ")}</p>
            <h3>Deliverables</h3>
            <Tags items={c.deliverables} />
            <h3>Reported tools</h3>
            <p>{c.tools.join(" / ")}</p>
            <p className="small muted">
              Model versions require confirmation. Pricing and dates depend on
              the agreed scope.
            </p>
          </div>
          <div className="passport-preview">
            <Check size={23} />
            <h3>Production transparency</h3>
            <p>{c.passport.evidence}</p>
            <p className="small">
              Usage conditions: {c.passport.commercialUsage}.
            </p>
            <p className="small muted">
              This is a creator declaration, not a certification.
            </p>
          </div>
        </aside>
      </div>
      {compareOpen && (
        <ComparisonDialog
          creators={sampleCreators.filter(
            (x) => comparison.ids.includes(x.id) || x.id === c.id,
          )}
          close={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
