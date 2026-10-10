"use client";
import Link from "next/link";
import { Bookmark, ArrowUpRight, Plus, Check } from "lucide-react";
import type { Creator } from "@/lib/schemas";
import { inr } from "@/lib/domain";
import { Art, Portrait, Tags, Button } from "./ui";
export function CreatorCard({
  creator: c,
  saved = false,
  compared = false,
  onSave,
  onCompare,
  score,
  reason,
}: {
  creator: Creator;
  saved?: boolean;
  compared?: boolean;
  onSave?: () => void;
  onCompare?: () => void;
  score?: number;
  reason?: string;
}) {
  return (
    <article className="creator-card">
      <Link className="portfolio-link" href={"/creators/" + c.slug}>
        <Art index={c.art} label={c.portfolio[0].title} />
        <span className="work-label">
          {c.portfolio[0].title}
          <ArrowUpRight size={16} />
        </span>
      </Link>
      <div className="creator-card-info">
        <div className="row">
          <div className="identity">
            <Portrait creator={c} />
            <div>
              <Link href={"/creators/" + c.slug}>
                <h3>{c.name}</h3>
              </Link>
              <p>{c.specialty}</p>
            </div>
          </div>
          {onSave && (
            <button
              className={`icon-button ${saved ? "selected" : ""}`}
              aria-label={saved ? "Unsave " + c.name : "Save " + c.name}
              onClick={onSave}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <Tags items={c.styles} />
        <p className="creator-bio">{c.bio}</p>
        <div className="creator-meta">
          <span>
            From <strong>{inr(c.price)}</strong>
          </span>
          <span className={c.available ? "availability" : "muted"}>
            {c.available
              ? "Available for projects"
              : "Enquire for availability"}
          </span>
        </div>
        <div className="tools-line">
          {c.tools.join(" / ")} · {c.experience} years, sample profile
        </div>
        {score !== undefined && (
          <p className="match-note">
            <strong>{score}% metadata fit</strong> {reason}
          </p>
        )}
        <div className="card-actions">
          <Link href={"/creators/" + c.slug}>
            View profile <ArrowUpRight size={15} />
          </Link>
          {onCompare && (
            <Button variant="ghost small" onClick={onCompare}>
              {compared ? <Check size={14} /> : <Plus size={14} />} Compare
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
