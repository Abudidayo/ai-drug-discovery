import { useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "../ui";
import { Molecule } from "../Molecule";
import { MethodNotes } from "../MethodNotes";
import { reviewers, facts, navigation, exportCandidates } from "./model";
import type { Tab, DemoMotion, Site, CandidateBrowser, DemoCandidate, Sort } from "./model";

export { Icon, MethodNotes };

export function Brand() {
  return (
    <span className="r2-brand">
      <svg viewBox="0 0 32 32" aria-hidden="true" fill="none">
        <path d="m8 8 17 2-3 16L8 22V8l14 18M25 10 8 22" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="8" r="3.5" fill="currentColor" />
        <circle cx="25" cy="10" r="3" fill="currentColor" />
        <circle cx="22" cy="26" r="3.5" fill="currentColor" />
        <circle cx="8" cy="22" r="2.5" fill="currentColor" />
      </svg>
      <span>Half Life</span>
    </span>
  );
}

export function Tabs({
  tab,
  go,
  numbered = false,
}: {
  tab: Tab;
  go: (tab: Tab) => void;
  numbered?: boolean;
}) {
  return (
    <nav className="r2-tabs" aria-label="Explore the project">
      {navigation.map((item, index) => (
        <button
          type="button"
          key={item.id}
          aria-current={item.id === tab ? "page" : undefined}
          onClick={() => {
            go(item.id);
          }}
        >
          {numbered && <span>{String(index + 1).padStart(2, "0")}</span>}
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function Action({
  children,
  onClick,
  secondary = false,
  icon = "arrow",
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  icon?: "arrow" | "play" | "download" | false;
}) {
  return (
    <button
      type="button"
      className={`r2-action ${secondary ? "r2-action-secondary" : ""}`}
      onClick={onClick}
    >
      {children}
      {icon && <Icon name={icon} size={17} />}
    </button>
  );
}

export function Playback({ motion }: { motion: DemoMotion }) {
  return (
    <div className="r2-playback">
      <button
        type="button"
        aria-label={
          motion.reduced ? "Reduced motion" : motion.playing ? "Pause animation" : "Play animation"
        }
        onClick={motion.toggle}
        disabled={motion.reduced}
      >
        <Icon name={motion.playing ? "pause" : "play"} size={14} />
        <span>{motion.reduced ? "Reduced motion" : motion.playing ? "Pause" : "Play"}</span>
      </button>
      <button type="button" aria-label="Replay animation" onClick={motion.replay}>
        <Icon name="replay" size={14} />
        <span>Replay</span>
      </button>
    </div>
  );
}

export function TourControls({ site }: { site: Site }) {
  const { tour } = site;
  return (
    <div className="r2-playback">
      <button
        type="button"
        aria-label={
          site.motion.reduced
            ? "Next workflow stage"
            : tour.playing
              ? "Pause workflow animation"
              : "Play workflow animation"
        }
        onClick={tour.toggle}
      >
        <Icon name={site.motion.reduced ? "arrow" : tour.playing ? "pause" : "play"} size={14} />
        <span>{site.motion.reduced ? "Next stage" : tour.playing ? "Pause" : "Play"}</span>
      </button>
      <button
        type="button"
        aria-label="Replay workflow animation"
        onClick={() => {
          tour.start();
          site.motion.replay();
        }}
      >
        <Icon name="replay" size={14} />
        <span>Replay</span>
      </button>
    </div>
  );
}

export function DemoLabel() {
  return (
    <p className="r2-demo-label">
      <span />
      {facts.demo}
    </p>
  );
}
export function Footer() {
  return (
    <footer className="r2-footer">
      <p>{facts.limit}</p>
      <span>OxHack ’26 · Research, explained.</span>
    </footer>
  );
}

export function Sources() {
  return (
    <div className="r2-sources">
      <span>Connected public evidence</span>
      <a href="https://platform.opentargets.org/" target="_blank" rel="noreferrer">
        Open Targets
      </a>
      <a href="https://www.ebi.ac.uk/chembl/" target="_blank" rel="noreferrer">
        ChEMBL
      </a>
      <a href="https://string-db.org/" target="_blank" rel="noreferrer">
        STRING
      </a>
      <a href="https://reactome.org/" target="_blank" rel="noreferrer">
        Reactome
      </a>
    </div>
  );
}

export function RecordTools({ browser }: { browser: CandidateBrowser }) {
  const [exported, setExported] = useState(false);
  return (
    <div className="r2-record-tools">
      <label className="r2-search">
        <Icon name="search" size={17} />
        <input
          type="search"
          aria-label="Find a drug or protein"
          placeholder="Find a drug or protein"
          value={browser.query}
          onChange={(event) => {
            browser.setQuery(event.target.value);
          }}
        />
      </label>
      <label className="r2-sort">
        <span>Sort</span>
        <select
          aria-label="Sort candidates"
          value={browser.sort}
          onChange={(event) => {
            browser.setSort(event.target.value as Sort);
          }}
        >
          <option value="shortlist">Shortlist order</option>
          <option value="network">Proximity rank</option>
          <option value="evidence">Evidence rank</option>
          <option value="jury">AI review rank</option>
          <option value="name">Drug name</option>
        </select>
      </label>
      <button
        type="button"
        className="r2-export"
        disabled={browser.rows.length === 0}
        onClick={() => {
          exportCandidates(browser.rows);
          setExported(true);
        }}
      >
        <Icon name="download" size={15} />
        Export CSV
      </button>
      <span className="r2-export-status" role="status">
        {exported ? "Demo CSV exported" : ""}
      </span>
    </div>
  );
}

export function RecordCount({ browser }: { browser: CandidateBrowser }) {
  return (
    <div className="r2-record-count">
      <span aria-live="polite">
        Showing {browser.rows.length} of {browser.filtered.length} candidates
      </span>
      {!browser.query.trim() && (
        <button
          type="button"
          onClick={() => {
            browser.setShowAll(!browser.showAll);
          }}
        >
          {browser.showAll ? "Show top five" : "Show all 15"}
          <Icon name="arrow" size={14} />
        </button>
      )}
    </div>
  );
}
export function EmptyRecords({ browser }: { browser: CandidateBrowser }) {
  return browser.rows.length === 0 ? (
    <div className="r2-empty">
      <Icon name="search" size={28} />
      <h3>No matching candidates</h3>
      <p>Try a drug name such as baricitinib or a protein such as JAK1.</p>
      <button
        type="button"
        onClick={() => {
          browser.setQuery("");
        }}
      >
        Clear search
      </button>
    </div>
  ) : null;
}

export function EvidencePanel({ candidate }: { candidate: DemoCandidate }) {
  const [view, setView] = useState<"evidence" | "reviews" | "molecule">("evidence");
  return (
    <section className="r2-evidence-panel" aria-label={`Details for ${candidate.displayName}`}>
      <div className="r2-evidence-heading">
        <div>
          <p>Candidate in focus</p>
          <h3>{candidate.displayName}</h3>
        </div>
        {candidate.known_answer && <span>Known reference</span>}
      </div>
      <p className="r2-targets">
        {candidate.targets.map((target) => target.name).join(" · ") || "Unmapped targets"}
      </p>
      <div className="r2-detail-tabs" aria-label="Candidate detail">
        <button
          type="button"
          aria-pressed={view === "evidence"}
          onClick={() => {
            setView("evidence");
          }}
        >
          Evidence
        </button>
        <button
          type="button"
          aria-pressed={view === "reviews"}
          onClick={() => {
            setView("reviews");
          }}
        >
          AI review
        </button>
        <button
          type="button"
          aria-pressed={view === "molecule"}
          onClick={() => {
            setView("molecule");
          }}
        >
          Molecule
        </button>
      </div>
      {view === "evidence" ? (
        <>
          <p className="r2-detail-intro">Trace the claim. Read the source.</p>
          <ul className="r2-evidence-list">
            {candidate.evidence
              .filter((item) => item.kind !== "warning")
              .slice(0, 4)
              .map((item) => (
                <li key={item.id}>
                  <span />
                  <div>
                    <p>{item.summary || item.statement}</p>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.source === "open_targets"
                        ? "Open Targets"
                        : item.source === "chembl"
                          ? "ChEMBL"
                          : item.source.replaceAll("_", " ")}
                      <Icon name="external" size={11} />
                    </a>
                  </div>
                </li>
              ))}
          </ul>
          <div className="r2-safety-note">
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
        </>
      ) : view === "reviews" ? (
        <div className="r2-model-reviews">
          <p className="r2-detail-intro">
            Illustrative independent reviews, with objections left in.
          </p>
          {candidate.votes.map((vote) => (
            <article key={vote.model_id}>
              <div>
                <strong>
                  {reviewers.find((reviewer) => reviewer.id === vote.model_id)?.display_name ??
                    vote.model_id}
                </strong>
                <span>Rank {vote.rank}</span>
              </div>
              <p>{vote.rationale}</p>
              {vote.objection && (
                <p className="r2-objection">
                  <strong>Open question</strong>
                  {vote.objection}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Molecule candidate={candidate} />
      )}
      <p className="r2-evidence-limit">
        {candidate.known_answer ? "A known teaching reference, not a new discovery. " : ""}Numerical
        ranks and reviews are fictional. These are research hypotheses.
      </p>
    </section>
  );
}
