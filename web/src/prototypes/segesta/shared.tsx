import { useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "../ui";
import { Molecule } from "../Molecule";
import { facts, tabs, reviewers } from "./model";
import type { Website, Sequence, DemoCandidate } from "./model";

export { Icon };
export function Brand({ short = false }: { short?: boolean }) {
  return (
    <a className="site-brand" href="#main-content" aria-label="Drug Repurposing Explorer">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="m6 22 9-15 11 16M6 22h20M15 7l2 15" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="6" cy="22" r="3" fill="currentColor" />
        <circle cx="15" cy="7" r="3" fill="currentColor" />
        <circle cx="26" cy="23" r="3" fill="currentColor" />
      </svg>
      <span>
        {short ? "Drug repurposing" : "Drug Repurposing"}
        <small>Explorer</small>
      </span>
    </a>
  );
}
export function Navigation({ site }: { site: Website }) {
  return (
    <nav className="site-tabs" aria-label="Explore the project">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={site.tab === tab.id ? "page" : undefined}
          onClick={() => {
            site.go(tab.id);
          }}
        >
          {tab.label}
          <Icon name="arrow" size={16} />
        </button>
      ))}
    </nav>
  );
}
export function Action({
  children,
  onClick,
  secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`site-action ${secondary ? "secondary" : ""}`}
      onClick={onClick}
    >
      {children}
      <Icon name="arrow" size={17} />
    </button>
  );
}
export function Controls({ motion }: { motion: Sequence }) {
  return (
    <div className="motion-controls">
      <span className="motion-status">
        <i />
        {motion.reduced
          ? "Reduced motion"
          : motion.playing
            ? "Playing explanation"
            : "Explanation paused"}
      </span>
      <button
        type="button"
        disabled={motion.reduced}
        onClick={motion.toggle}
        aria-label={
          motion.reduced
            ? "Reduced motion enabled"
            : motion.playing
              ? "Pause animation"
              : "Play animation"
        }
      >
        <Icon name={motion.playing ? "pause" : "play"} size={14} />
        {motion.playing ? "Pause" : "Play"}
      </button>
      <button type="button" onClick={motion.replay} aria-label="Replay animation">
        <Icon name="replay" size={14} />
        Replay
      </button>
    </div>
  );
}
export function Sources() {
  return (
    <div className="source-strip">
      <span>Built on public evidence</span>
      <a href="https://platform.opentargets.org/" target="_blank" rel="noreferrer">
        Open Targets
        <Icon name="external" size={12} />
      </a>
      <a href="https://string-db.org/" target="_blank" rel="noreferrer">
        STRING
        <Icon name="external" size={12} />
      </a>
      <a href="https://www.ebi.ac.uk/chembl/" target="_blank" rel="noreferrer">
        ChEMBL
        <Icon name="external" size={12} />
      </a>
      <a href="https://reactome.org/" target="_blank" rel="noreferrer">
        Reactome
        <Icon name="external" size={12} />
      </a>
    </div>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <span>Drug Repurposing Explorer</span>
      <p>Research hypotheses only. Experimental validation required.</p>
      <span>OxHack 2026</span>
    </footer>
  );
}
export function Method() {
  return (
    <details className="method-note">
      <summary>
        What this prototype demonstrates
        <Icon name="chevron" size={16} />
      </summary>
      <div>
        <p>{facts.fixture}</p>
        <p>{facts.path}</p>
        <p>{facts.docking}</p>
        <p>{facts.limit}</p>
      </div>
    </details>
  );
}
export function Evidence({ candidate }: { candidate: DemoCandidate }) {
  const [view, setView] = useState<"evidence" | "review" | "molecule">("evidence");
  return (
    <section className="evidence-sheet" aria-label={`Details for ${candidate.displayName}`}>
      <div className="evidence-title">
        <div>
          <h3>{candidate.displayName}</h3>
        </div>
        {candidate.known_answer && <span className="reference-label">Known reference</span>}
      </div>
      <p className="target-list">
        {candidate.targets.map((target) => target.name).join(" · ") || "Unmapped targets"}
      </p>
      <div className="detail-switcher" aria-label="Candidate details">
        {(["evidence", "review", "molecule"] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => {
              setView(id);
            }}
          >
            {id === "review" ? "AI review" : id === "evidence" ? "Evidence" : "Molecule"}
          </button>
        ))}
      </div>
      {view === "evidence" ? (
        <div className="evidence-content">
          {candidate.evidence
            .filter((entry) => entry.kind !== "warning")
            .slice(0, 3)
            .map((entry) => (
              <article className="evidence-entry" key={entry.id}>
                <p>{entry.summary || entry.statement}</p>
                <a href={entry.url} target="_blank" rel="noreferrer">
                  {entry.source.replaceAll("_", " ")}
                  <Icon name="external" size={12} />
                </a>
              </article>
            ))}
          <div className="safety-note">
            <Icon name="flask" size={17} />
            <div>
              <strong>
                {candidate.safety_status === "warnings_recorded"
                  ? "Safety warnings recorded"
                  : "Safety not evaluated"}
              </strong>
              <p>
                {candidate.warnings.length
                  ? candidate.warnings
                      .map((warning) => warning.toxicity_class ?? warning.type)
                      .join("; ")
                  : "Missing warning data does not establish safety."}
              </p>
            </div>
          </div>
        </div>
      ) : view === "review" ? (
        <div className="review-content">
          {candidate.votes.length ? (
            candidate.votes.map((vote) => (
              <article key={vote.model_id}>
                <h4>
                  {reviewers.find((reviewer) => reviewer.id === vote.model_id)?.display_name ??
                    vote.model_id}
                  <span>Rank {vote.rank}</span>
                </h4>
                <p>{vote.rationale}</p>
                {vote.objection && (
                  <p className="review-objection">
                    <strong>Open question</strong> {vote.objection}
                  </p>
                )}
              </article>
            ))
          ) : (
            <p>No recorded AI reviews for this candidate.</p>
          )}
        </div>
      ) : (
        <Molecule candidate={candidate} />
      )}
      <p className="evidence-footnote">
        {candidate.known_answer ? "A teaching reference, not a new discovery. " : ""}Example ranks
        and AI reviews are fictional.
      </p>
    </section>
  );
}
