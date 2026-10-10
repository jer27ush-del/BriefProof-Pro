"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Save,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  type Campaign,
  type CampaignState,
  type Creator,
  proposedMilestonesSchema,
  observationSchema,
  licenseOutputSchema,
  evaluationSchema,
} from "@/lib/schemas";
import { inr, acceptanceErrors, passportFindings } from "@/lib/domain";
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
} from "../ui";
import { VisualReview, LicenseReview } from "./reviews";
import { Milestones } from "./milestones";
const tabs = [
  "Overview",
  "Brief",
  "Creators",
  "Brand consistency",
  "LicenseGuard",
  "Milestones",
  "Final delivery",
];
type SaveResult = {
  updated_at: string;
  state: CampaignState;
  status: Campaign["status"];
  creator_id: string | null;
};
export function CampaignWorkspace({
  initial,
  creators,
  aiReady,
}: {
  initial: Campaign;
  creators: Creator[];
  aiReady: boolean;
}) {
  const [campaign, setCampaign] = useState(initial),
    [state, setState] = useState(initial.state),
    [milestones, setMilestones] = useState(initial.milestones),
    [tab, setTab] = useState("Overview"),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [warning, setWarning] = useState("");
  const toast = useToast(),
    router = useRouter();
  const selected = creators.find((c) => c.id === campaign.creator_id),
    brief = campaign.brief.input;
  function change(next: CampaignState) {
    setState({ ...next, acceptedAt: null });
    setDirty(true);
  }
  async function persist(
    overrides: { creatorId?: string; status?: Campaign["status"] } = {},
  ) {
    const data = await request<SaveResult>(
      "/api/campaigns/" + campaign.id,
      { version: campaign.updated_at, state, milestones, ...overrides },
      "PATCH",
    );
    setCampaign((prev) => ({
      ...prev,
      updated_at: data.updated_at,
      state: data.state,
      status: data.status,
      creator_id: data.creator_id,
      milestones,
    }));
    setState(data.state);
    setDirty(false);
    return data;
  }
  async function save(
    overrides: { creatorId?: string; status?: Campaign["status"] } = {},
  ) {
    setBusy("save");
    setError("");
    try {
      await persist(overrides);
      toast("Campaign changes saved.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy("");
    }
  }
  async function runAi(
    task: "consistency" | "license" | "milestones" | "evaluate",
  ) {
    if (
      task === "milestones" &&
      milestones.length &&
      !confirm(
        "Replace the current milestone proposal? Saved notes will be replaced only when you save the new plan.",
      )
    )
      return;
    setBusy(task);
    setError("");
    try {
      await persist();
      const data = await request<{ result: unknown }>("/api/ai/" + task, {
        campaignId: campaign.id,
      });
      if (task === "consistency") {
        const result = observationSchema.parse(data.result);
        setState((prev) => ({ ...prev, observations: result }));
      }
      if (task === "license") {
        const result = licenseOutputSchema.parse(data.result);
        setState((prev) => ({ ...prev, licenseReview: result }));
      }
      if (task === "evaluate") {
        const result = evaluationSchema.parse(data.result);
        setState((prev) => ({ ...prev, evaluation: result }));
      }
      if (task === "milestones") {
        const result = proposedMilestonesSchema.parse(data.result);
        setWarning(result.warning);
        setMilestones(
          result.milestones.map((m) => ({
            ...m,
            id: crypto.randomUUID(),
            status: "Not Started",
            notes: "",
          })),
        );
      }
      setDirty(true);
      toast(
        "AI result ready for review. Save changes to keep the working result.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy("");
    }
  }
  async function remove() {
    if (
      !confirm(
        "Delete this campaign, its brief and milestones? This cannot be undone.",
      )
    )
      return;
    setBusy("delete");
    try {
      await request("/api/campaigns/" + campaign.id, undefined, "DELETE");
      toast("Campaign deleted.");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy("");
    }
  }
  function download() {
    const blob = new Blob(
        [
          JSON.stringify(
            {
              ...campaign,
              state,
              milestones,
              exportedAt: new Date().toISOString(),
              notice:
                "Creator declarations and AI suggestions require human review. No legal clearance is granted.",
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "BriefProof-campaign-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const progress = Math.round(
    (milestones.filter((m) => m.status === "Approved").length /
      (milestones.length || 1)) *
      100,
  );
  return (
    <div className="campaign-workspace">
      <div className="workspace-title">
        <div>
          <Link href="/dashboard" className="back-link">
            ← All campaigns
          </Link>
          <p className="eyebrow">
            {brief.brand} / {campaign.status}
          </p>
          <h1>{brief.name}</h1>
          <p className="muted">
            {brief.platform} · {brief.duration} · Due {brief.deadline}
          </p>
        </div>
        <div className="actions">
          <Button variant="outline small" onClick={download}>
            <Download size={15} /> Export report
          </Button>
          <Button
            variant="primary small"
            pending={busy === "save"}
            disabled={Boolean(busy)}
            onClick={() => save()}
          >
            <Save size={15} /> {dirty ? "Save changes" : "Saved / save again"}
          </Button>
        </div>
      </div>
      {error && <Notice error>{error}</Notice>}
      {!aiReady && (
        <Notice>
          AI services are not configured. Manual reviews, creator selection,
          saved briefs and editable milestones remain available.
        </Notice>
      )}
      <nav className="workspace-tabs" aria-label="Campaign views">
        {tabs.map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === "Overview" && (
        <>
          <div className="campaign-overview">
            <Art index={selected?.art || 0} />
            <div>
              <p className="eyebrow">The creative direction</p>
              <h2>{brief.objective}</h2>
              <p>{brief.idea}</p>
              <Tags items={brief.style.split(",").map((s) => s.trim())} />
              <div className="overview-numbers">
                <div>
                  <small>Budget</small>
                  <strong>{inr(brief.budget)}</strong>
                </div>
                <div>
                  <small>Revision rounds</small>
                  <strong>{brief.revisions}</strong>
                </div>
                <div>
                  <small>Milestone progress</small>
                  <strong>{progress}%</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="overview-panels">
            <div className="panel">
              <h3>Your creative partner</h3>
              {selected ? (
                <div className="identity">
                  <Portrait creator={selected} />
                  <div>
                    <strong>{selected.name}</strong>
                    <p>{selected.specialty}</p>
                  </div>
                </div>
              ) : (
                <p className="muted">
                  Choose a creator who fits your direction.
                </p>
              )}
              <Link
                className="text-link"
                href={"/discover?campaign=" + campaign.id}
              >
                Find & compare creators <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="panel">
              <h3>Before final delivery</h3>
              <p>
                {
                  state.frames.filter(
                    (f) =>
                      f.status === "Pending" || f.status === "Needs revision",
                  ).length
                }{" "}
                frames awaiting a decision
              </p>
              <p>
                {passportFindings(state.passport).length} production items to
                review
              </p>
              <p>
                {milestones.filter((m) => m.status !== "Approved").length}{" "}
                milestones not yet approved
              </p>
            </div>
            <div className="panel">
              <h3>Campaign status</h3>
              <Field label="Current stage">
                {(id) => (
                  <select
                    id={id}
                    value={
                      campaign.status === "Completed"
                        ? "In Review"
                        : campaign.status
                    }
                    disabled={Boolean(busy)}
                    onChange={(e) =>
                      save({ status: e.target.value as Campaign["status"] })
                    }
                  >
                    {["Draft", "In Review", "In Progress"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                )}
              </Field>
              <p className="small muted">
                Completion is recorded through the final delivery review.
              </p>
            </div>
          </div>
        </>
      )}
      {tab === "Brief" && (
        <>
          <div className="section-heading compact">
            <h2>A shared direction.</h2>
            <Link
              className="button outline small"
              href={"/brief/new?edit=" + campaign.brief.id}
            >
              Edit brief <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="brief-readout">
            {Object.entries(
              campaign.brief.output || {
                idea: brief.idea,
                objective: brief.objective,
                audience: brief.audience,
                style: brief.style,
                specifications: brief.deliverables.join(", "),
                brandConstraints: brief.brandGuidelines,
                commercialUsage: brief.commercialUsage,
              },
            ).map(([k, v]) => (
              <section key={k}>
                <p className="eyebrow">{k.replace(/([A-Z])/g, " $1")}</p>
                {Array.isArray(v) ? (
                  <ul>
                    {v.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{v}</p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
      {tab === "Creators" && (
        <>
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Proof before promises</p>
              <h2>Choose your collaborator.</h2>
            </div>
            <Link
              className="button outline small"
              href={"/discover?campaign=" + campaign.id}
            >
              Compare profiles <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="creator-selection-grid">
            {creators.map((c) => (
              <div
                className={`selection-card ${selected?.id === c.id ? "chosen" : ""}`}
                key={c.id}
              >
                <Portrait creator={c} />
                <div>
                  <h3>{c.name}</h3>
                  <p className="small muted">{c.specialty}</p>
                  <p className="small">
                    From {inr(c.price)} ·{" "}
                    {c.available ? "Available" : "Confirm dates"}
                  </p>
                </div>
                <Button
                  variant="outline small"
                  disabled={Boolean(busy) || selected?.id === c.id}
                  onClick={() => {
                    if (
                      selected &&
                      !confirm(
                        "Change creator and reset their production passport reviews?",
                      )
                    )
                      return;
                    void save({ creatorId: c.id });
                  }}
                >
                  {selected?.id === c.id ? "Selected" : "Select"}
                </Button>
              </div>
            ))}
          </div>
          {selected && (
            <div className="analysis-result">
              <div className="row">
                <h3>How does {selected.name.split(" ")[0]} fit this brief?</h3>
                <Button
                  variant="primary small"
                  disabled={!aiReady || Boolean(busy)}
                  pending={busy === "evaluate"}
                  onClick={() => runAi("evaluate")}
                >
                  <Sparkles size={15} /> Evaluate supplied evidence
                </Button>
              </div>
              <p className="small muted">
                AI compares declared profile evidence with this brief. It does
                not judge an actual audition or verify the portfolio.
              </p>
              {state.evaluation && (
                <>
                  <p>{state.evaluation.summary}</p>
                  {state.evaluation.criteria.map((x, i) => (
                    <div className="finding" key={i}>
                      <span className="badge">
                        {x.criterion} / {x.status}
                      </span>
                      <p>{x.finding}</p>
                      <small>
                        Evidence: {x.evidenceIds.join(", ") || "Not supplied"}
                      </small>
                    </div>
                  ))}
                  <ul>
                    {state.evaluation.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
      {tab === "Brand consistency" && (
        <VisualReview
          state={state}
          onChange={change}
          aiReady={aiReady}
          busy={busy}
          runAi={runAi}
        />
      )}
      {tab === "LicenseGuard" && (
        <LicenseReview
          state={state}
          onChange={change}
          aiReady={aiReady}
          busy={busy}
          runAi={runAi}
        />
      )}
      {tab === "Milestones" && (
        <Milestones
          items={milestones}
          onChange={(m) => {
            setMilestones(m);
            setDirty(true);
          }}
          deadline={brief.deadline}
          aiReady={aiReady}
          busy={busy}
          generate={() => runAi("milestones")}
          warning={warning}
        />
      )}
      {tab === "Final delivery" && (
        <section>
          <p className="eyebrow">One last, thoughtful review</p>
          <h2>Ready to call it finished?</h2>
          <div className="delivery-layout">
            <div className="panel">
              <h3>Acceptance checklist</h3>
              {Object.entries({
                received: "Required deliverables received",
                format: "Format and specifications reviewed",
                consistency: "Brand issues resolved or acknowledged",
                usage: "Usage-related information reviewed",
                revisions: "Revision requirements satisfied",
              }).map(([k, t]) => (
                <label className="check-label delivery-check" key={k}>
                  <input
                    type="checkbox"
                    checked={
                      state.checklist[k as keyof CampaignState["checklist"]]
                    }
                    onChange={(e) =>
                      change({
                        ...state,
                        checklist: {
                          ...state.checklist,
                          [k]: e.target.checked,
                        },
                      })
                    }
                  />
                  {t}
                </label>
              ))}
              <Field label="Delivery references and review notes">
                {(id) => (
                  <textarea
                    id={id}
                    value={state.deliveryNotes}
                    rows={4}
                    onChange={(e) =>
                      change({ ...state, deliveryNotes: e.target.value })
                    }
                    placeholder="Record handoff links, filenames and acceptance notes."
                  />
                )}
              </Field>
              <Button
                variant="primary"
                pending={busy === "save"}
                disabled={Boolean(busy)}
                onClick={() => save({ status: "Completed" })}
              >
                <CheckCircle2 size={17} /> Record brand acceptance
              </Button>
              {state.acceptedAt && (
                <p className="success">
                  Accepted {new Date(state.acceptedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="panel">
              <h3>Outstanding decisions</h3>
              {acceptanceErrors(state, campaign.creator_id).length ? (
                <ul>
                  {acceptanceErrors(state, campaign.creator_id).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className="success">
                  The review checklist is ready for acceptance.
                </p>
              )}
              <Notice>
                Acceptance records your brand’s decision. It does not
                independently verify delivery files or grant commercial-use
                clearance.
              </Notice>
            </div>
          </div>
        </section>
      )}
      <div className="workspace-bottom">
        <span className="small muted">
          {dirty
            ? "Unsaved changes. Save before leaving."
            : "Changes stored in your account."}
        </span>
        <Button
          variant="ghost danger small"
          pending={busy === "delete"}
          disabled={Boolean(busy)}
          onClick={remove}
        >
          <Trash2 size={14} /> Delete campaign
        </Button>
      </div>
    </div>
  );
}
