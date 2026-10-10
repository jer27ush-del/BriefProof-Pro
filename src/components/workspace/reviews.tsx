"use client";
import { Sparkles, Check, X } from "lucide-react";
import {
  type CampaignState,
  type Passport,
  passportLabels,
} from "@/lib/schemas";
import { passportFindings } from "@/lib/domain";
import { Button, Field, Notice } from "../ui";
import { UploadField, PrivateImage } from "../assets";
type Props = {
  state: CampaignState;
  onChange: (state: CampaignState) => void;
  aiReady: boolean;
  busy: string;
  runAi: (task: "consistency" | "license") => void;
};
export function VisualReview({ state, onChange, aiReady, busy, runAi }: Props) {
  function change(next: CampaignState) {
    onChange({ ...next, observations: null, acceptedAt: null });
  }
  return (
    <section>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Brand consistency</p>
          <h2>A second look, with context.</h2>
        </div>
        <Button
          variant="primary small"
          disabled={
            !aiReady ||
            Boolean(busy) ||
            !state.referencePath ||
            !state.frames.length
          }
          pending={busy === "consistency"}
          onClick={() => runAi("consistency")}
        >
          <Sparkles size={16} /> Analyze with vision AI
        </Button>
      </div>
      <Notice>
        AI observations may be incorrect. Review product appearance, packaging,
        colors, composition and logo placement yourself before approving a
        frame. This is not exact visual verification.
      </Notice>
      <div className="review-upload-grid">
        <div className="panel">
          <h3>01 / Brand reference</h3>
          {state.referencePath && (
            <PrivateImage path={state.referencePath} alt="Brand reference" />
          )}
          <UploadField
            label={
              state.referencePath
                ? "Replace brand reference"
                : "Upload product or logo reference"
            }
            onUploaded={(path) =>
              change({
                ...state,
                referencePath: path,
                frames: state.frames.map((f) => ({ ...f, status: "Pending" })),
              })
            }
          />
        </div>
        <div className="panel">
          <h3>02 / Campaign frames</h3>
          <p className="muted">
            Add up to four images. Start with a product close-up and a frame
            showing the logo or label.
          </p>
          <UploadField
            label="Add a campaign frame"
            disabled={state.frames.length >= 4}
            onUploaded={(path, name) =>
              change({
                ...state,
                frames: [
                  ...state.frames,
                  {
                    id: crypto.randomUUID(),
                    path,
                    name,
                    note: "",
                    status: "Pending",
                  },
                ],
              })
            }
          />
          <p className="small muted">
            Images are stored in your private Supabase bucket. When you run
            analysis, the selected images are sent to OpenAI.
          </p>
        </div>
      </div>
      <div className="frame-grid">
        {state.frames.map((f, i) => (
          <div className="panel" key={f.id}>
            <PrivateImage path={f.path} alt={f.name} />
            <div className="row">
              <h3>Frame {String(i + 1).padStart(2, "0")}</h3>
              <button
                className="icon-button"
                aria-label="Remove frame"
                onClick={() =>
                  change({
                    ...state,
                    frames: state.frames.filter((x) => x.id !== f.id),
                  })
                }
              >
                <X size={16} />
              </button>
            </div>
            <span className="badge">{f.status}</span>
            <Field label="Human review note">
              {(id) => (
                <textarea
                  id={id}
                  value={f.note}
                  rows={2}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      frames: state.frames.map((x) =>
                        x.id === f.id ? { ...x, note: e.target.value } : x,
                      ),
                      acceptedAt: null,
                    })
                  }
                />
              )}
            </Field>
            <Field label="Review decision">
              {(id) => (
                <select
                  id={id}
                  value={f.status}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      frames: state.frames.map((x) =>
                        x.id === f.id
                          ? { ...x, status: e.target.value as typeof f.status }
                          : x,
                      ),
                      acceptedAt: null,
                    })
                  }
                >
                  {[
                    "Pending",
                    "Approved",
                    "Needs revision",
                    "Acknowledged",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        ))}
      </div>
      {state.observations && (
        <div className="analysis-result">
          <p className="eyebrow">AI observations / human review required</p>
          <h3>{state.observations.summary}</h3>
          {state.observations.observations.map((o, i) => (
            <div className="finding" key={i}>
              <span className="badge">
                Frame {o.frame} / {o.category}
              </span>
              <p>{o.observation}</p>
              <small>{o.suggestedAction}</small>
            </div>
          ))}
          <Notice>{state.observations.limitations}</Notice>
        </div>
      )}
    </section>
  );
}
export function LicenseReview({
  state,
  onChange,
  aiReady,
  busy,
  runAi,
}: Props) {
  const findings = passportFindings(state.passport);
  return (
    <section>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">LicenseGuard / production passport</p>
          <h2>Know how it was made.</h2>
        </div>
        <Button
          variant="primary small"
          disabled={!aiReady || Boolean(busy)}
          pending={busy === "license"}
          onClick={() => runAi("license")}
        >
          <Sparkles size={16} /> Review with AI
        </Button>
      </div>
      <Notice>
        Production transparency and decision support only. Creator declarations
        are not independently validated. This is not legal advice or a guarantee
        of commercial-use clearance.
      </Notice>
      <div className="license-layout">
        <div className="panel">
          <h3>Creator-supplied information</h3>
          <p className="muted small">
            Use “Not supplied”, “Unknown” or “Not applicable” where appropriate.
          </p>
          <div className="form-grid">
            {Object.entries(passportLabels).map(([key, label]) => (
              <Field key={key} label={label}>
                {(id) => (
                  <textarea
                    id={id}
                    rows={3}
                    value={state.passport[key as keyof Passport]}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        passport: { ...state.passport, [key]: e.target.value },
                        passportReviewed: false,
                        acknowledged: state.acknowledged.filter(
                          (x) => x !== key,
                        ),
                        licenseReview: null,
                        acceptedAt: null,
                      })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
        <aside>
          <div className="panel">
            <span className="badge">
              {findings.length
                ? "Information requires review"
                : "Checklist complete"}
            </span>
            <h3>Make the gaps visible.</h3>
            {findings.map((f) => (
              <div className="finding" key={f.key}>
                <strong>{passportLabels[f.key as keyof Passport]}</strong>
                <p className="small muted">{f.reason}</p>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={state.acknowledged.includes(f.key)}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        acknowledged: e.target.checked
                          ? [...state.acknowledged, f.key]
                          : state.acknowledged.filter((x) => x !== f.key),
                        acceptedAt: null,
                      })
                    }
                  />{" "}
                  Acknowledge this unresolved item
                </label>
              </div>
            ))}
            {!findings.length && (
              <p>
                All fields are supplied. This does not establish independent
                legal clearance.
              </p>
            )}
            <label className="check-label review-check">
              <input
                type="checkbox"
                checked={state.passportReviewed}
                onChange={(e) =>
                  onChange({
                    ...state,
                    passportReviewed: e.target.checked,
                    acceptedAt: null,
                  })
                }
              />
              <Check size={16} /> I have reviewed this information.
            </label>
          </div>
        </aside>
      </div>
      {state.licenseReview && (
        <div className="analysis-result">
          <p className="eyebrow">AI decision support</p>
          <h3>{state.licenseReview.summary}</h3>
          {state.licenseReview.items.map((x, i) => (
            <div className="finding" key={i}>
              <strong>{x.field}</strong>
              <p>{x.concern}</p>
              <small>Ask: {x.question}</small>
            </div>
          ))}
          <Notice>{state.licenseReview.disclaimer}</Notice>
        </div>
      )}
    </section>
  );
}
