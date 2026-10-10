import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ScanLine,
  GitCompareArrows,
  ListChecks,
  Check,
} from "lucide-react";
import { Art, Portrait } from "@/components/ui";
import { CreatorCard } from "@/components/creator-card";
import { sampleCreators } from "@/data/creators";
export default function Home() {
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-line" /> The creative talent marketplace,
            reconsidered
          </p>
          <h1>
            Great creative work
            <br />
            deserves <em>better proof.</em>
          </h1>
          <p className="hero-description">
            Find AI creators who understand your vision. Go beyond the
            portfolio—with thoughtful matching, transparent workflows, and a
            clearer path to delivery.
          </p>
          <div className="actions">
            <Link className="button primary" href="/discover">
              Find your creative match <ArrowUpRight size={18} />
            </Link>
            <Link className="button ghost" href="/brief/new">
              Build a campaign brief <ArrowRight size={17} />
            </Link>
          </div>
          <p className="hero-footnote">
            Built for ambitious brands. Made for a new kind of creator.
          </p>
        </div>
        <div className="hero-composition">
          <div className="hero-main">
            <Art index={0} />
            <div className="art-caption">
              <span>AURELLE / AFTERGLOW</span>
              <span>Product film concept, 2026</span>
            </div>
          </div>
          <div className="hero-side">
            <Art index={1} />
            <div className="direction-card">
              <span className="eyebrow">
                From direction to the right talent
              </span>
              <p>
                Cinematic.
                <br />
                Considered.
                <br />
                <em>Distinctly yours.</em>
              </p>
              <div className="direction-footer">
                <Portrait creator={sampleCreators[0]} />
                <div>
                  <strong>Maya Chen</strong>
                  <small>Cinematic product filmmaker</small>
                </div>
                <Check size={18} />
              </div>
            </div>
          </div>
          <div className="hero-index">
            01 — A new standard for creative collaboration
          </div>
        </div>
      </section>
      <section className="value-strip container">
        {[
          [
            ScanLine,
            "Better matching",
            "Find creators through the way they see, think and make.",
          ],
          [
            GitCompareArrows,
            "Verifiable workflow",
            "Ask for the process and evidence behind the final frame.",
          ],
          [
            ListChecks,
            "Clearer delivery",
            "Agree on scope, review criteria and the next step.",
          ],
        ].map(([Icon, title, copy]) => {
          const I = Icon as typeof ScanLine;
          return (
            <div key={String(title)}>
              <I size={23} />
              <h3>{String(title)}</h3>
              <p>{String(copy)}</p>
            </div>
          );
        })}
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Independent minds. Distinct creative worlds.
            </p>
            <h2>
              Find the person behind
              <br />
              your next great project.
            </h2>
          </div>
          <Link className="text-link" href="/discover">
            Explore all creators <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="creator-grid">
          {[sampleCreators[0], sampleCreators[1], sampleCreators[3]].map(
            (c) => (
              <CreatorCard key={c.id} creator={c} />
            ),
          )}
        </div>
        <p className="caption">
          Fictional sample profiles and AI-generated concept artwork. No client
          or verification claims.
        </p>
      </section>
      <section className="process-section" id="how-it-works">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                A little more intention. A lot less guesswork.
              </p>
              <h2>
                From a rough idea
                <br />
                to a shared direction.
              </h2>
            </div>
            <p className="muted max-copy">
              Keep the brief, the creative evidence and the delivery plan in the
              same conversation.
            </p>
          </div>
          <div className="process-grid">
            {[
              [
                "01",
                "Put your vision into words.",
                "Work through a focused brief builder. AI turns your direction into editable specifications and useful follow-up questions.",
              ],
              [
                "02",
                "Find fit. Then ask for proof.",
                "Discover relevant portfolios, compare capabilities and review how a creator approaches your particular campaign.",
              ],
              [
                "03",
                "Create with a clear plan.",
                "Review brand consistency and production information. Set milestones and agree on what finished means.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span className="process-num">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section editorial-split">
        <div className="stack-art">
          <Art index={2} />
          <div className="small-art">
            <Art index={3} />
          </div>
        </div>
        <div>
          <p className="eyebrow">Creative DNA + Proof-of-Brief</p>
          <h2>
            A beautiful portfolio
            <br />
            is only the beginning.
          </h2>
          <p className="body-large muted">
            The right creative partner understands the assignment—and can show
            you how they’ll bring it to life.
          </p>
          <div className="editorial-item">
            <span>01</span>
            <div>
              <h3>Match the visual language.</h3>
              <p>
                Compare style, capabilities, budget and deliverables against
                actual profile information.
              </p>
            </div>
          </div>
          <div className="editorial-item">
            <span>02</span>
            <div>
              <h3>Make the evidence visible.</h3>
              <p>
                Review declared tools, source assets and production decisions.
                Missing information stays visible.
              </p>
            </div>
          </div>
          <Link href="/brief/new" className="text-link">
            Start with your brief <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="container final-cta">
        <div>
          <p className="eyebrow">
            Your next project starts with a better question.
          </p>
          <h2>
            What could we
            <br />
            <em>make together?</em>
          </h2>
        </div>
        <div>
          <p>
            Give your next idea the creative partner—and the clarity—it
            deserves.
          </p>
          <Link className="button light" href="/brief/new">
            Build your first brief <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
    </>
  );
}
