import { useState } from "react";
import { candidates, exportCandidates, initialCandidate, reviewers } from "./data";
import type { DemoCandidate } from "./data";
import { Button, Icon, SampleNotice } from "./ui";
import { RankShift } from "./visuals";
import { delay } from "./hooks";
import { Molecule } from "./Molecule";

type SortOrder = "shortlist" | "network" | "evidence" | "jury" | "name";
type DetailView = "evidence" | "reviews" | "molecule";

export function CandidateDetails({ candidate }: { candidate: DemoCandidate }) {
  const [view, setView] = useState<DetailView>("evidence");
  return (
    <aside className="candidate-details" aria-label={`Details for ${candidate.displayName}`}>
      <div className="details-heading">
        <span className="candidate-symbol">
          <Icon name="flask" size={20} />
        </span>
        <div>
          <span className="details-label">Candidate in focus</span>
          <h3>{candidate.displayName}</h3>
        </div>
        {candidate.known_answer && <span className="reference-tag">Known reference</span>}
      </div>
      <p className="details-targets">
        Targets {candidate.targets.map((target) => target.name).join(", ") || "not mapped"}
      </p>
      <div className="detail-switch" aria-label="Candidate detail">
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
        <div className="evidence-content">
          <p className="detail-intro">Follow each claim back to its source.</p>
          <ul className="evidence-list">
            {candidate.evidence
              .filter((evidence) => evidence.kind !== "warning")
              .slice(0, 4)
              .map((evidence) => (
                <li key={evidence.id}>
                  <span className="evidence-node" />
                  <div>
                    <p>{evidence.summary || evidence.statement}</p>
                    <a href={evidence.url} target="_blank" rel="noreferrer">
                      {evidence.source === "open_targets"
                        ? "Open Targets"
                        : evidence.source === "chembl"
                          ? "ChEMBL"
                          : evidence.source.replaceAll("_", " ")}
                      <Icon name="external" size={12} />
                    </a>
                  </div>
                </li>
              ))}
          </ul>
          <div
            className={`safety-note ${candidate.safety_status === "warnings_recorded" ? "safety-has-warnings" : ""}`}
          >
            <strong>
              {candidate.safety_status === "warnings_recorded"
                ? "Safety warnings recorded"
                : "Safety has not been evaluated"}
            </strong>
            <p>
              {candidate.warnings.length > 0
                ? candidate.warnings
                    .map((warning) => warning.toxicity_class ?? warning.type)
                    .join("; ") + ". Review the original sources before drawing conclusions."
                : "Missing warnings do not establish safety. Further evidence is needed."}
            </p>
          </div>
        </div>
      ) : view === "reviews" ? (
        <div className="review-content">
          <p className="detail-intro">
            Independent views on the same evidence. Reviews below are illustrative.
          </p>
          {candidate.votes.slice(0, 3).map((vote) => (
            <div key={vote.model_id} className="review-entry">
              <div>
                <strong>
                  {reviewers.find((reviewer) => reviewer.id === vote.model_id)?.display_name ??
                    vote.model_id}
                </strong>
                <span>Rank {vote.rank}</span>
              </div>
              <p>{vote.rationale}</p>
              {vote.objection && (
                <p className="review-objection">
                  <strong>Open question</strong> {vote.objection}
                </p>
              )}
            </div>
          ))}
          {candidate.votes.length === 0 && (
            <p>No recorded review is available for this candidate.</p>
          )}
        </div>
      ) : (
        <Molecule candidate={candidate} />
      )}
      <div className="detail-limit">
        {candidate.known_answer
          ? "Known COVID-19 reference in this teaching example; not a new discovery. "
          : ""}
        Sample scores and reviews are fictional.
      </div>
    </aside>
  );
}

export function Results({
  layout = "split",
  showChart = true,
}: {
  layout?: "split" | "stacked";
  showChart?: boolean;
}) {
  const [selected, setSelected] = useState(initialCandidate);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("shortlist");
  const [showAll, setShowAll] = useState(false);
  const [exported, setExported] = useState(false);
  const matching = candidates
    .filter((candidate) =>
      `${candidate.displayName} ${candidate.targets.map((target) => target.name).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "name") return a.displayName.localeCompare(b.displayName);
      if (sort === "network") return (a.network?.rank ?? Infinity) - (b.network?.rank ?? Infinity);
      if (sort === "evidence")
        return (a.direct_evidence_rank ?? Infinity) - (b.direct_evidence_rank ?? Infinity);
      if (sort === "jury") return (a.juryRank ?? Infinity) - (b.juryRank ?? Infinity);
      return a.shortlist_rank - b.shortlist_rank;
    });
  const rows = showAll || query.trim() ? matching : matching.slice(0, 5);
  const focus =
    rows.find((candidate) => candidate.candidate_id === selected.candidate_id) ?? rows[0];

  return (
    <div className={`results results-${layout}`}>
      <SampleNotice />
      {showChart && (
        <div className="results-story">
          <div className="results-story-copy">
            <h2>
              A ranking starts
              <br />
              the conversation.
            </h2>
            <p>
              Independent review can change which candidates look worth a closer look. Compare the
              reasoning, not just the position.
            </p>
            <span className="small-note">Illustrative COVID-19 example. Lower rank is better.</span>
          </div>
          <RankShift selected={selected} onSelect={setSelected} />
        </div>
      )}
      {!showChart && (
        <details className="compact-rank-review">
          <summary>
            <span>Watch how AI review changes the order</span>
            <Icon name="replay" size={16} />
          </summary>
          <div>
            <RankShift selected={selected} onSelect={setSelected} />
          </div>
        </details>
      )}
      <div className="results-grid">
        <section className="shortlist-table-section" aria-label="Candidate shortlist">
          <div className="table-heading">
            <div>
              <h2>Your research shortlist</h2>
              <p>Choose a candidate to inspect its evidence.</p>
            </div>
            <Button
              secondary
              icon="download"
              onClick={() => {
                exportCandidates(rows);
                setExported(true);
              }}
              disabled={rows.length === 0}
            >
              Export CSV
            </Button>
          </div>
          <div className="table-controls">
            <label className="search-control">
              <Icon name="search" size={17} />
              <input
                type="search"
                placeholder="Find a drug or protein"
                aria-label="Find a drug or protein"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </label>
            <label className="sort-control">
              <span>Sort by</span>
              <select
                aria-label="Sort candidates"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOrder);
                }}
              >
                <option value="shortlist">Shortlist</option>
                <option value="network">Network rank</option>
                <option value="evidence">Evidence rank</option>
                <option value="jury">AI review rank</option>
                <option value="name">Drug name</option>
              </select>
            </label>
          </div>
          <div className="table-scroll">
            <table className="candidate-table">
              <caption className="visually-hidden">
                Illustrative candidates for COVID-19. All ranks are fictional demo values.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Candidate</th>
                  <th scope="col">Proximity</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">AI review</th>
                  <th scope="col">Safety</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((candidate, index) => (
                  <tr
                    key={candidate.candidate_id}
                    className={
                      candidate.candidate_id === focus?.candidate_id ? "candidate-selected" : ""
                    }
                    style={delay(index)}
                  >
                    <td>
                      <button
                        type="button"
                        className="candidate-name"
                        onClick={() => {
                          setSelected(candidate);
                        }}
                        aria-pressed={candidate.candidate_id === focus?.candidate_id}
                      >
                        {candidate.displayName}
                        <Icon name="chevron" size={13} />
                      </button>
                      <span className="table-targets">
                        {candidate.targets
                          .slice(0, 3)
                          .map((target) => target.name)
                          .join(" · ") || "Unmapped targets"}
                      </span>
                    </td>
                    <td>
                      {candidate.network?.rank === undefined ? (
                        <span title="This candidate cannot be scored in the network">
                          Unavailable
                        </span>
                      ) : (
                        <span className="rank-number">#{candidate.network.rank}</span>
                      )}
                    </td>
                    <td>
                      <span className="rank-number">
                        {candidate.direct_evidence_rank === null
                          ? "Unavailable"
                          : `#${String(candidate.direct_evidence_rank)}`}
                      </span>
                    </td>
                    <td>
                      <span className="rank-number">
                        {candidate.juryRank === null
                          ? "Unavailable"
                          : `#${String(candidate.juryRank)}`}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`safety-status ${candidate.safety_status === "warnings_recorded" ? "status-warnings" : ""}`}
                      >
                        <span />
                        {candidate.safety_status === "warnings_recorded"
                          ? "Warnings"
                          : "Not evaluated"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="table-empty">
              <Icon name="search" size={28} />
              <h3>No matching candidates</h3>
              <p>Try a drug name such as “baricitinib” or a protein such as “JAK1”.</p>
              <Button
                secondary
                onClick={() => {
                  setQuery("");
                }}
                icon={false}
              >
                Clear search
              </Button>
            </div>
          )}
          <div className="table-bottom">
            <span aria-live="polite">
              {exported
                ? "Demo CSV exported."
                : `Showing ${String(rows.length)} of ${String(matching.length)} candidates`}
            </span>
            {!query.trim() && (
              <button
                type="button"
                onClick={() => {
                  setShowAll(!showAll);
                }}
              >
                {showAll ? "Show top five" : "Show all 15"}
                <Icon name="chevron" size={14} />
              </button>
            )}
          </div>
          <p className="table-explainer">
            This layout uses the legacy proximity fixture. The current application selects 10
            physical-RWR candidates plus 5 from direct evidence. Evidence: direct disease–target
            links. AI review: independent evidence assessment. These ranks are different lenses, not
            success probabilities.
          </p>
        </section>
        {focus && <CandidateDetails key={focus.candidate_id} candidate={focus} />}
      </div>
    </div>
  );
}
