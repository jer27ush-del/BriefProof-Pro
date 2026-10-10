"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import {
  briefInputSchema,
  briefOutputSchema,
  exampleInput,
  type BriefInput,
  type BriefOutput,
  type Brief,
  type Creator,
} from "@/lib/schemas";
import {
  Button,
  Field,
  Notice,
  Portrait,
  useToast,
  request,
  message,
} from "./ui";
import { UploadField, PrivateImage } from "./assets";
const outputLabels: Record<keyof BriefOutput, string> = {
  objective: "Campaign objective",
  audience: "Target audience",
  concept: "Creative concept",
  visualDirection: "Visual direction",
  specifications: "Deliverables & specifications",
  brandConstraints: "Brand constraints",
  productionConsiderations: "Production considerations",
  timeline: "Timeline & milestones",
  acceptanceCriteria: "Acceptance criteria",
  missingInformation: "Missing information & follow-up questions",
  commercialConfirmations: "Commercial terms to confirm",
};
const initialInput: BriefInput = {
  name: "",
  brand: "",
  product: "",
  idea: "",
  audience: "",
  objective: "",
  style: "",
  mood: "",
  platform: "Instagram",
  aspectRatio: "9:16",
  brandGuidelines: "",
  deliverables: ["Vertical video"],
  duration: "15 seconds",
  budget: 10000,
  deadline: "",
  revisions: 2,
  commercialUsage: "",
  referencePaths: [],
};
export function BriefBuilder({
  aiReady,
  creator,
  existing,
}: {
  aiReady: boolean;
  creator?: Creator;
  existing?: Brief;
}) {
  const [input, setInput] = useState<BriefInput>(
      existing?.input || initialInput,
    ),
    [output, setOutput] = useState<BriefOutput | null>(
      existing?.output || null,
    ),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [questions, setQuestions] = useState<string[]>([]),
    [mode, setMode] = useState(
      existing?.output ? "Saved brief" : "Manual input",
    );
  const router = useRouter(),
    toast = useToast();
  function update<K extends keyof BriefInput>(k: K, v: BriefInput[K]) {
    setInput({ ...input, [k]: v });
    setOutput(null);
    setMode("Manual input");
  }
  const groups: (keyof BriefInput)[][] = [
    ["name", "brand", "product", "idea", "audience", "objective"],
    ["style", "mood", "platform", "aspectRatio", "brandGuidelines"],
    [
      "deliverables",
      "duration",
      "budget",
      "deadline",
      "revisions",
      "commercialUsage",
    ],
  ];
  function validate(all = false) {
    const result = briefInputSchema.safeParse(input);
    if (!result.success) {
      const issues = result.error.issues.filter(
        (i) => all || groups[step]?.includes(i.path[0] as keyof BriefInput),
      );
      if (issues.length) {
        setError(
          issues.map((i) => `${String(i.path[0])}: ${i.message}`).join(" "),
        );
        return false;
      }
    }
    if (
      (all || step === 2) &&
      input.deadline < new Date().toISOString().slice(0, 10)
    ) {
      setError("Choose today or a future deadline.");
      return false;
    }
    setError("");
    return true;
  }
  async function generate(section?: keyof BriefOutput) {
    if (!validate(true)) return;
    setBusy(section || "generate");
    setError("");
    try {
      const { result } = await request<{ result: BriefOutput }>(
        "/api/ai/brief",
        { input, section },
      );
      const parsed = briefOutputSchema.parse(result);
      setOutput(
        section && output ? { ...output, [section]: parsed[section] } : parsed,
      );
      setMode("AI-generated · editable");
      setStep(3);
      toast(
        section
          ? "Selected section regenerated."
          : "Your AI brief is ready for review.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy("");
    }
  }
  async function followUp() {
    if (!validate(true)) return;
    setBusy("questions");
    try {
      const { result } = await request<{ result: { questions: string[] } }>(
        "/api/ai/questions",
        { input },
      );
      setQuestions(result.questions);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy("");
    }
  }
  async function save() {
    if (!validate(true)) return;
    setBusy("save");
    try {
      const { campaignId } = await request<{ campaignId: string }>(
        "/api/briefs",
        { id: existing?.id, input, output, creatorId: creator?.id || null },
      );
      toast("Brief saved to your account.");
      router.push("/dashboard?campaign=" + campaignId);
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy("");
    }
  }
  function manual() {
    setOutput({
      objective: input.objective,
      audience: input.audience,
      concept: input.idea,
      visualDirection: input.style,
      specifications:
        input.deliverables.join(", ") +
        " / " +
        input.duration +
        " / " +
        input.aspectRatio,
      brandConstraints: input.brandGuidelines || "To be confirmed",
      productionConsiderations: "Add your production requirements.",
      timeline:
        "Deadline: " +
        input.deadline +
        "; " +
        input.revisions +
        " revision rounds.",
      acceptanceCriteria: "Add measurable delivery acceptance criteria.",
      missingInformation: [],
      commercialConfirmations: [input.commercialUsage],
    });
    setMode("Manual brief · not AI-generated");
  }
  function inputField(k: keyof BriefInput, label: string, multiline = false) {
    return (
      <Field label={label}>
        {(id) =>
          multiline ? (
            <textarea
              id={id}
              value={String(input[k])}
              onChange={(e) => update(k, e.target.value as never)}
              rows={k === "idea" ? 5 : 3}
            />
          ) : (
            <input
              id={id}
              value={String(input[k])}
              onChange={(e) => update(k, e.target.value as never)}
            />
          )
        }
      </Field>
    );
  }
  return (
    <div className="container builder-page">
      <div className="builder-top">
        <Link href="/dashboard" className="back-link">
          <ArrowLeft size={15} /> Workspace
        </Link>
        <span className="eyebrow">
          {existing
            ? "Edit campaign brief"
            : "A clear brief changes everything"}
        </span>
      </div>
      <div className="builder-layout">
        <aside className="builder-sidebar">
          <p className="eyebrow">The brief studio</p>
          <h1>
            From a spark
            <br />
            to a <em>shared vision.</em>
          </h1>
          <p className="muted">
            A few thoughtful details give your creative partner a much better
            place to start.
          </p>
          <ol className="step-list">
            {[
              "The idea",
              "Creative direction",
              "Scope & constraints",
              "Your working brief",
            ].map((t, i) => (
              <li
                key={t}
                className={step === i ? "current" : i < step ? "complete" : ""}
              >
                <span>
                  {i < step ? (
                    <Check size={14} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {t}
              </li>
            ))}
          </ol>
          {creator && (
            <div className="selected-creator">
              <Portrait creator={creator} />
              <div>
                <small>Creating a brief for</small>
                <strong>{creator.name}</strong>
              </div>
            </div>
          )}
          <Button
            variant="ghost small"
            onClick={() => {
              setInput(exampleInput());
              setOutput(null);
              setMode("Manual input");
              setError("");
            }}
          >
            Use Aurelle example <ArrowUpRightIcon />
          </Button>
        </aside>
        <section className="builder-form">
          <div className="form-heading">
            <span className="eyebrow">0{step + 1} / 04</span>
            <h2>
              {
                [
                  "What are we making?",
                  "How should it feel?",
                  "Let’s define the scope.",
                  "A brief everyone can build on.",
                ][step]
              }
            </h2>
            <p className="muted">
              {
                [
                  "Start with the essentials. There’s room to refine your idea.",
                  "Think in textures, moments, movement and emotion.",
                  "Clear constraints make room for better creative decisions.",
                  "Review every section. Make the direction unmistakably yours.",
                ][step]
              }
            </p>
          </div>
          {error && <Notice error>{error}</Notice>}
          {!aiReady && (
            <Notice>
              AI is not configured. You can write and save a manual brief. Add
              OPENAI_API_KEY on the server to enable generation.
            </Notice>
          )}
          {step === 0 && (
            <div className="form-grid">
              {inputField("name", "Campaign name")}
              {inputField("brand", "Brand")}
              {inputField("product", "Product or service")}
              {inputField("audience", "Target audience")}
              <div className="span-2">
                {inputField("idea", "Your rough creative idea", true)}
              </div>
              <div className="span-2">
                {inputField(
                  "objective",
                  "What should this campaign achieve?",
                  true,
                )}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="form-grid">
              {inputField("style", "Visual style")}
              {inputField("mood", "Tone and mood")}
              <Field label="Primary platform">
                {(id) => (
                  <select
                    id={id}
                    value={input.platform}
                    onChange={(e) =>
                      update(
                        "platform",
                        e.target.value as BriefInput["platform"],
                      )
                    }
                  >
                    {["Instagram", "TikTok", "YouTube", "Website"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Aspect ratio">
                {(id) => (
                  <select
                    id={id}
                    value={input.aspectRatio}
                    onChange={(e) =>
                      update(
                        "aspectRatio",
                        e.target.value as BriefInput["aspectRatio"],
                      )
                    }
                  >
                    {["9:16", "16:9", "1:1"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                )}
              </Field>
              <div className="span-2">
                {inputField(
                  "brandGuidelines",
                  "Brand guidelines and non-negotiables",
                  true,
                )}
              </div>
              <div className="span-2">
                <UploadField
                  label="Add a mood-board reference"
                  disabled={input.referencePaths.length >= 4}
                  onUploaded={(path) =>
                    update("referencePaths", [...input.referencePaths, path])
                  }
                />
                <p className="small muted">
                  References are stored privately for your project. Brief
                  generation uses your written direction; images are analyzed
                  separately in Brand Consistency.
                </p>
                <div className="reference-grid">
                  {input.referencePaths.map((p) => (
                    <div key={p}>
                      <PrivateImage path={p} alt="Mood-board reference" />
                      <button
                        className="icon-button"
                        aria-label="Remove reference"
                        onClick={() =>
                          update(
                            "referencePaths",
                            input.referencePaths.filter((x) => x !== p),
                          )
                        }
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="form-grid">
              <fieldset className="span-2">
                <legend>Required deliverables</legend>
                <div className="deliverable-options">
                  {(
                    [
                      "Vertical video",
                      "Product images",
                      "Animation",
                      "Explainer",
                    ] as const
                  ).map((d) => (
                    <label
                      key={d}
                      className={input.deliverables.includes(d) ? "chosen" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={input.deliverables.includes(d)}
                        onChange={(e) =>
                          update(
                            "deliverables",
                            e.target.checked
                              ? [...input.deliverables, d]
                              : input.deliverables.filter((x) => x !== d),
                          )
                        }
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </fieldset>
              {inputField("duration", "Duration / output specifications")}
              <Field label="Budget in INR">
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={100}
                    max={100000000}
                    value={input.budget}
                    onChange={(e) => update("budget", Number(e.target.value))}
                  />
                )}
              </Field>
              <Field label="Delivery deadline">
                {(id) => (
                  <input
                    id={id}
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={input.deadline}
                    onChange={(e) => update("deadline", e.target.value)}
                  />
                )}
              </Field>
              <Field label="Revision rounds">
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={0}
                    max={10}
                    value={input.revisions}
                    onChange={(e) =>
                      update("revisions", Number(e.target.value))
                    }
                  />
                )}
              </Field>
              <div className="span-2">
                {inputField(
                  "commercialUsage",
                  "Intended commercial usage and terms to confirm",
                  true,
                )}
              </div>
            </div>
          )}
          {step === 3 && (
            <>
              <div className="brief-generation-bar">
                <span className="badge">{mode}</span>
                <Button
                  variant="primary small"
                  disabled={!aiReady || Boolean(busy)}
                  pending={busy === "generate"}
                  onClick={() => generate()}
                >
                  <Sparkles size={16} />
                  {output ? "Regenerate brief" : "Generate with AI"}
                </Button>
              </div>
              {!output ? (
                <div className="empty-state">
                  <Sparkles size={30} />
                  <h3>Your direction is ready.</h3>
                  <p>
                    Generate a structured brief using the real AI service, or
                    write one manually.
                  </p>
                  <Button variant="outline" onClick={manual}>
                    Continue with a manual brief
                  </Button>
                </div>
              ) : (
                <div className="generated-sections">
                  {Object.entries(outputLabels).map(([key, label]) => {
                    const k = key as keyof BriefOutput,
                      v = output[k];
                    return (
                      <div key={k}>
                        <div className="row">
                          <label htmlFor={"output-" + k}>{label}</label>
                          <Button
                            variant="ghost icon-only"
                            disabled={!aiReady || Boolean(busy)}
                            pending={busy === k}
                            aria-label={"Regenerate " + label}
                            onClick={() => generate(k)}
                          >
                            <RotateCcw size={14} />
                          </Button>
                        </div>
                        <textarea
                          id={"output-" + k}
                          value={Array.isArray(v) ? v.join("\n") : v}
                          onChange={(e) =>
                            setOutput({
                              ...output,
                              [k]: Array.isArray(v)
                                ? e.target.value.split("\n").filter(Boolean)
                                : e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="actions">
                <Button
                  variant="outline small"
                  disabled={!aiReady || Boolean(busy)}
                  pending={busy === "questions"}
                  onClick={followUp}
                >
                  Find missing information
                </Button>
              </div>
              {questions.length > 0 && (
                <Notice>
                  <strong>Questions to resolve</strong>
                  <ul>
                    {questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </Notice>
              )}
            </>
          )}
          <div className="builder-controls">
            <Button
              variant="ghost"
              disabled={step === 0 || Boolean(busy)}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <div className="actions">
              {step === 3 ? (
                <Button
                  variant="primary"
                  pending={busy === "save"}
                  disabled={Boolean(busy)}
                  onClick={save}
                >
                  <Save size={16} /> Save brief & continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (validate()) setStep(step + 1);
                  }}
                >
                  Continue <ArrowRight size={16} />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={15} />;
}
