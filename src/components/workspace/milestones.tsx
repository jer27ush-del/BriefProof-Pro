"use client";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import type { Milestone } from "@/lib/schemas";
import { Button, Field, Notice } from "../ui";
export function Milestones({
  items,
  onChange,
  deadline,
  aiReady,
  busy,
  generate,
  warning,
}: {
  items: Milestone[];
  onChange: (items: Milestone[]) => void;
  deadline: string;
  aiReady: boolean;
  busy: string;
  generate: () => void;
  warning: string;
}) {
  function update(id: string, key: keyof Milestone, value: string) {
    onChange(items.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  }
  return (
    <section>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Scope to milestones</p>
          <h2>A clear next step.</h2>
        </div>
        <div className="actions">
          <Button
            variant="outline small"
            onClick={() =>
              onChange([
                ...items,
                {
                  id: crypto.randomUUID(),
                  name: "New milestone",
                  description: "",
                  deliverable: "Define the deliverable",
                  acceptanceCriteria: "Define acceptance criteria",
                  due: deadline,
                  owner: "Creator",
                  status: "Not Started",
                  dependency: "",
                  notes: "",
                },
              ])
            }
            disabled={items.length >= 18}
          >
            <Plus size={15} /> Add manually
          </Button>
          <Button
            variant="primary small"
            pending={busy === "milestones"}
            disabled={!aiReady || Boolean(busy)}
            onClick={generate}
          >
            <Sparkles size={16} />
            {items.length ? "Regenerate plan" : "Generate plan"}
          </Button>
        </div>
      </div>
      <Notice>
        {warning ||
          "Dates are proposals, not promises. Confirm creator availability and the feasibility of overlapping tasks."}
      </Notice>
      {!items.length && (
        <div className="empty-state">
          <h3>Your plan starts with the brief.</h3>
          <p>Generate a proposal with AI, or add milestones manually.</p>
        </div>
      )}
      {items.map((m, i) => (
        <details className="milestone" key={m.id} open={i === 0}>
          <summary>
            <span className="milestone-num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <strong>{m.name}</strong>
            <span className="badge">{m.status}</span>
            <span className="muted small">{m.due}</span>
          </summary>
          <div className="form-grid">
            {[
              ["name", "Milestone name"],
              ["description", "Description"],
              ["deliverable", "Deliverable"],
              ["acceptanceCriteria", "Acceptance criteria"],
              ["dependency", "Dependency"],
              ["notes", "Review notes"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                {(id) => (
                  <textarea
                    id={id}
                    rows={2}
                    value={m[key as keyof Milestone]}
                    onChange={(e) =>
                      update(m.id, key as keyof Milestone, e.target.value)
                    }
                  />
                )}
              </Field>
            ))}
            <Field label="Due date">
              {(id) => (
                <input
                  id={id}
                  type="date"
                  max={deadline}
                  value={m.due}
                  onChange={(e) => update(m.id, "due", e.target.value)}
                />
              )}
            </Field>
            <Field label="Responsible party">
              {(id) => (
                <select
                  id={id}
                  value={m.owner}
                  onChange={(e) => update(m.id, "owner", e.target.value)}
                >
                  <option>Brand</option>
                  <option>Creator</option>
                </select>
              )}
            </Field>
            <Field label="Status">
              {(id) => (
                <select
                  id={id}
                  value={m.status}
                  onChange={(e) => update(m.id, "status", e.target.value)}
                >
                  {[
                    "Not Started",
                    "In Progress",
                    "Needs Review",
                    "Approved",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              )}
            </Field>
            <Button
              variant="ghost danger"
              onClick={() => onChange(items.filter((x) => x.id !== m.id))}
            >
              <Trash2 size={15} /> Remove milestone
            </Button>
          </div>
        </details>
      ))}
    </section>
  );
}
