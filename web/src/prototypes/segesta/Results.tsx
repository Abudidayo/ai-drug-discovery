import { useState } from "react";
import type { CSSProperties } from "react";
import {
  candidates,
  exportCandidates,
  facts,
  rank,
  targets,
  useCandidateBrowser,
  useSequence,
} from "./model";
import type { CandidateBrowser, Direction, Sequence, Sort } from "./model";
import { Controls, Evidence, Icon, Method } from "./shared";

const examples = [
  candidates.find((candidate) => candidate.displayName === "Baricitinib"),
  candidates.find((candidate) => candidate.displayName === "Ruxolitinib"),
  candidates.find((candidate) => candidate.displayName === "Tofacitinib"),
].filter((candidate) => candidate !== undefined);

function RankAnimation({
  direction,
  browser,
  motion,
}: {
  direction: Direction;
  browser: CandidateBrowser;
  motion: Sequence;
}) {
  return (
    <section className={`rank-explainer rank-${direction}`} data-playing={motion.playing}>
      <div className="rank-copy">
        <h2>
          A second look can
          <br />
          change the order.
        </h2>
        <p>Compare the starting shortlist with independent AI review. Lower rank is better.</p>
        <Controls motion={motion} />
      </div>
      <div className="rank-art" key={motion.revision}>
        <div className="rank-columns">
          <span>Starting shortlist</span>
          <span>After AI review</span>
        </div>
        {direction === "horizon" ? (
          <svg
            viewBox="0 0 600 180"
            role="img"
            aria-label="Illustrative rank changes for three candidates. The labelled ranks come from the fictional demonstration fixture."
          >
            {examples.map((candidate, i) => {
              const start = 28 + candidate.shortlist_rank * 9;
              const end = 28 + (candidate.juryRank ?? candidate.shortlist_rank) * 9;
              return (
                <g key={candidate.candidate_id} className={`rank-stroke color-${String(i)}`}>
                  <path
                    d={`M40 ${String(start)}C220 ${String(start)} 340 ${String(end)} 510 ${String(end)}`}
                  />
                  <circle cx="40" cy={start} r="4" />
                  <circle cx="510" cy={end} r="4" />
                  <g
                    className="rank-particle"
                    data-motion-target
                    style={
                      {
                        "--rank-y": `${String(end - start)}px`,
                        animationDelay: `${String(i * 180)}ms`,
                      } as CSSProperties
                    }
                  >
                    <circle cx="40" cy={start} r="6" />
                  </g>
                  <text x="4" y={start + 4}>
                    {candidate.shortlist_rank}
                  </text>
                  <text x="530" y={end + 4}>
                    {candidate.juryRank ?? "—"}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : direction === "relay" ? (
          <div className="rank-sort">
            <div className="rank-start-list">
              {examples.map((candidate) => (
                <button
                  type="button"
                  key={candidate.candidate_id}
                  onClick={() => {
                    browser.choose(candidate);
                  }}
                >
                  <span>{rank(candidate.shortlist_rank)}</span>
                  <strong>{candidate.displayName}</strong>
                </button>
              ))}
            </div>
            <Icon name="arrow" size={20} />
            <div className="rank-sorted-list">
              {examples.map((candidate, index) => {
                const after = [...examples]
                  .sort((a, b) => (a.juryRank ?? Infinity) - (b.juryRank ?? Infinity))
                  .findIndex((entry) => entry.candidate_id === candidate.candidate_id);
                return (
                  <button
                    type="button"
                    key={candidate.candidate_id}
                    className="rank-sorted-record"
                    data-motion-target={index === 1 ? "" : undefined}
                    style={
                      {
                        "--from-y": `${String(index * 44)}px`,
                        "--to-y": `${String(after * 44)}px`,
                      } as CSSProperties
                    }
                    onClick={() => {
                      browser.choose(candidate);
                    }}
                  >
                    <strong>{candidate.displayName}</strong>
                    <span>{rank(candidate.juryRank)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rank-ledger">
            {examples.map((candidate, i) => (
              <button
                type="button"
                className={`rank-ledger-row color-${String(i)}`}
                key={candidate.candidate_id}
                onClick={() => {
                  browser.choose(candidate);
                }}
                aria-pressed={browser.active.candidate_id === candidate.candidate_id}
              >
                <strong>{candidate.displayName}</strong>
                <span>{rank(candidate.shortlist_rank)}</span>
                <div className="ledger-track">
                  <i
                    className="ledger-traveler"
                    data-motion-target
                    style={{ animationDelay: `${String(i * 200)}ms` }}
                  />
                </div>
                <span>{rank(candidate.juryRank)}</span>
              </button>
            ))}
          </div>
        )}
        {direction === "horizon" && (
          <div className="rank-key">
            {examples.map((candidate, i) => (
              <button
                key={candidate.candidate_id}
                type="button"
                className={`color-${String(i)}`}
                onClick={() => {
                  browser.choose(candidate);
                }}
              >
                <i />
                {candidate.displayName}
              </button>
            ))}
          </div>
        )}
        <small>Fictional example ranks · these are not measured research outcomes</small>
      </div>
    </section>
  );
}
function CandidateTable({ browser }: { browser: CandidateBrowser }) {
  const [exported, setExported] = useState(false);
  return (
    <section className="candidate-records" aria-label="Candidate shortlist">
      <div className="table-title">
        <h2>Research shortlist</h2>
        <span>COVID-19 teaching example</span>
      </div>
      <div className="record-tools">
        <label className="candidate-search">
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
        <button
          type="button"
          className="export-button"
          disabled={!browser.rows.length}
          onClick={() => {
            exportCandidates(browser.rows);
            setExported(true);
          }}
        >
          <Icon name="download" size={15} />
          Export CSV
        </button>
      </div>
      <span className="export-status" role="status">
        {exported ? "Example CSV exported" : ""}
      </span>
      {browser.rows.length ? (
        <div className="candidate-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Compound / target</th>
                <th scope="col">Shortlist</th>
                <th scope="col">Proximity</th>
                <th scope="col">AI review</th>
                <th scope="col">Safety</th>
              </tr>
            </thead>
            <tbody>
              {browser.rows.map((candidate) => (
                <tr
                  key={candidate.candidate_id}
                  data-selected={browser.active.candidate_id === candidate.candidate_id}
                >
                  <td>
                    <button
                      type="button"
                      aria-pressed={browser.active.candidate_id === candidate.candidate_id}
                      onClick={() => {
                        browser.choose(candidate);
                      }}
                    >
                      <strong>{candidate.displayName}</strong>
                      <small>{targets(candidate)}</small>
                    </button>
                  </td>
                  <td>{rank(candidate.shortlist_rank)}</td>
                  <td>{rank(candidate.network?.rank)}</td>
                  <td>{rank(candidate.juryRank)}</td>
                  <td>
                    {candidate.safety_status === "warnings_recorded" ? "Warnings" : "Not evaluated"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-records">
          <h3>No matching candidates</h3>
          <p>Try a compound such as baricitinib or a protein such as JAK1.</p>
          <button
            type="button"
            onClick={() => {
              browser.setQuery("");
            }}
          >
            Clear search
          </button>
        </div>
      )}
      <div className="record-count">
        <span aria-live="polite">
          {browser.rows.length} of {browser.filtered.length} candidates
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
      <p className="fixture-note">
        Legacy proximity example. The current app uses 10 RWR + 5 direct-evidence candidates,
        deduplicated and refilled.
      </p>
    </section>
  );
}
export function Results({ direction }: { direction: Direction }) {
  const browser = useCandidateBrowser();
  const motion = useSequence(2, 6000);
  const table = <CandidateTable browser={browser} />;
  const evidence =
    browser.rows.length > 0 ? (
      <Evidence key={browser.active.candidate_id} candidate={browser.active} />
    ) : null;
  return (
    <section className={`results-page results-${direction}`}>
      <div className="page-title">
        <h1>
          {direction === "specimen" ? (
            <>
              A lead, with
              <br />
              <em>the evidence attached.</em>
            </>
          ) : direction === "relay" ? (
            <>
              Open the shortlist.
              <br />
              Interrogate the evidence.
            </>
          ) : (
            <>
              Possibilities,
              <br />
              with perspective.
            </>
          )}
        </h1>
        <p>
          Select a compound. Inspect its sources.
          <br />
          See what the independent reviewers questioned.
        </p>
      </div>
      <p className="demo-label">
        <i />
        {facts.demo}
      </p>
      {direction !== "specimen" && (
        <RankAnimation direction={direction} browser={browser} motion={motion} />
      )}
      <div className="results-layout">
        {direction === "specimen" ? (
          <>
            {evidence}
            {table}
          </>
        ) : (
          <>
            {table}
            {evidence}
          </>
        )}
      </div>
      {direction === "specimen" && (
        <RankAnimation direction={direction} browser={browser} motion={motion} />
      )}
      <Method />
    </section>
  );
}
