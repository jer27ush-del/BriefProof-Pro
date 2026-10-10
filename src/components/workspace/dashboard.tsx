"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  LayoutDashboard,
  Bookmark,
  FileText,
  Clock,
  Folder,
} from "lucide-react";
import type { Campaign, Creator } from "@/lib/schemas";
import { inr, passportFindings } from "@/lib/domain";
import { CreatorCard } from "../creator-card";
import { CampaignWorkspace } from "./campaign";
export function Dashboard({
  campaigns,
  creators,
  savedIds,
  name,
  campaignId,
  aiReady,
}: {
  campaigns: Campaign[];
  creators: Creator[];
  savedIds: string[];
  name: string;
  campaignId?: string;
  aiReady: boolean;
}) {
  const selected = campaigns.find((c) => c.id === campaignId);
  return (
    <div className="dashboard-layout">
      <aside className="workspace-sidebar">
        <p className="eyebrow">Brand workspace</p>
        <nav aria-label="Workspace">
          <Link href="/dashboard" className={!selected ? "active" : ""}>
            <LayoutDashboard size={17} /> Overview
          </Link>
          <Link href="/brief/new">
            <Plus size={17} /> Create a brief
          </Link>
          <Link href="/discover">
            <Bookmark size={17} /> Discover creators
          </Link>
          <Link href="/dashboard#saved">
            <Folder size={17} /> Saved talent
          </Link>
        </nav>
        <div className="sidebar-account">
          <span className="account-initial">
            {name[0]?.toUpperCase() || "B"}
          </span>
          <div>
            <strong>{name}</strong>
            <small>Brand account</small>
          </div>
        </div>
      </aside>
      <div className="dashboard-content">
        {selected ? (
          <CampaignWorkspace
            key={selected.id}
            initial={selected}
            creators={creators}
            aiReady={aiReady}
          />
        ) : (
          <>
            <div className="workspace-title">
              <div>
                <p className="eyebrow">Your creative workspace</p>
                <h1>
                  Make something
                  <br />
                  <em>worth remembering.</em>
                </h1>
                <p className="muted">
                  Welcome back, {name}. Here’s where your projects stand.
                </p>
              </div>
              <Link href="/brief/new" className="button primary">
                <Plus size={17} /> New campaign brief
              </Link>
            </div>
            <div className="stats-grid">
              {[
                [
                  Folder,
                  "Active campaigns",
                  campaigns.filter(
                    (c) => c.status !== "Completed" && c.status !== "Draft",
                  ).length,
                ],
                [
                  FileText,
                  "Draft briefs",
                  campaigns.filter((c) => c.status === "Draft").length,
                ],
                [Bookmark, "Saved creators", savedIds.length],
                [
                  Clock,
                  "Production review items",
                  campaigns.reduce(
                    (n, c) => n + passportFindings(c.state.passport).length,
                    0,
                  ),
                ],
              ].map(([Icon, title, count]) => {
                const I = Icon as typeof Folder;
                return (
                  <div key={String(title)}>
                    <I size={19} />
                    <span>{String(title)}</span>
                    <strong>{Number(count)}</strong>
                  </div>
                );
              })}
            </div>
            <div className="section-heading compact">
              <h2>Your campaigns</h2>
              <span className="small muted">Updated most recently</span>
            </div>
            {!campaigns.length ? (
              <div className="empty-state bordered">
                <FileText size={32} />
                <h3>Your next great campaign starts here.</h3>
                <p>
                  Build a clear brief, choose a creator and keep each decision
                  in one place.
                </p>
                <Link className="button primary" href="/brief/new">
                  Create your first brief <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="campaign-list">
                {campaigns.map((c) => (
                  <Link
                    className="campaign-row"
                    key={c.id}
                    href={"/dashboard?campaign=" + c.id}
                  >
                    <div className="campaign-monogram">
                      {c.brief.input.brand.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3>{c.brief.input.name}</h3>
                      <p>
                        {c.brief.input.product} · {c.brief.input.platform}
                      </p>
                    </div>
                    <span className="badge">{c.status}</span>
                    <div>
                      <strong>{inr(c.brief.input.budget)}</strong>
                      <small>Due {c.brief.input.deadline}</small>
                    </div>
                    <ArrowUpRight size={19} />
                  </Link>
                ))}
              </div>
            )}
            <section id="saved">
              <div className="section-heading compact">
                <h2>Your saved talent</h2>
                <Link href="/discover" className="text-link">
                  Explore creators <ArrowUpRight size={16} />
                </Link>
              </div>
              {savedIds.length ? (
                <div className="creator-grid">
                  {creators
                    .filter((c) => savedIds.includes(c.id))
                    .map((c) => (
                      <CreatorCard key={c.id} creator={c} />
                    ))}
                </div>
              ) : (
                <p className="muted">
                  Bookmark creators in discovery to keep your shortlist close.
                </p>
              )}
            </section>
            <section className="activity-panel">
              <h3>Recent activity</h3>
              {campaigns.slice(0, 4).map((c) => (
                <div className="row" key={c.id}>
                  <span>
                    Updated{" "}
                    <Link href={"/dashboard?campaign=" + c.id}>
                      {c.brief.input.name}
                    </Link>
                  </span>
                  <time className="muted small">
                    {new Date(c.updated_at).toLocaleDateString("en-IN")}
                  </time>
                </div>
              ))}
              {!campaigns.length && (
                <p className="muted">
                  Activity will appear when you save a campaign.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
