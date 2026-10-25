import type { CSSProperties } from "react";
import { candidates, facts, rank, targets, useCandidateBrowser, useDemoMotion } from "./model";
import type { CandidateBrowser, DemoMotion } from "./model";
import {
  DemoLabel,
  RecordTools,
  RecordCount,
  EvidencePanel,
  EmptyRecords,
  Playback,
  Icon,
  MethodNotes,
} from "./components";

function RankStory({ browser, motion }: { browser: CandidateBrowser; motion: DemoMotion }) {
  const examples = candidates.slice(0, 3);
  return (
    <div className="rank-story">
      <div className="rank-story-caption">
        <h2>
          A ranking invites
          <br />
          <em>a second opinion.</em>
        </h2>
        <p>
          Compare the initial shortlist with independent AI review. A changed position is a prompt
          to inspect the reasoning.
        </p>
        <span>Illustrative ranks · Lower is better</span>
        <Playback motion={motion} />
      </div>
      <div className="rank-graphic" data-playing={motion.playing} key={motion.revision}>
        <svg
          viewBox="0 0 640 240"
          role="img"
          aria-label="Compare fictional shortlist positions and AI review positions for three medicines"
        >
          <text x="95" y="23">
            Initial shortlist
          </text>
          <text x="480" y="23">
            AI review
          </text>
          {[1, 5, 10, 15].map((value) => (
            <g key={value} className="rank-grid">
              <path d={`M95 ${String(45 + value * 10)} H550`} />
              <text x="70" y={49 + value * 10}>
                {value}
              </text>
            </g>
          ))}
          {examples.map((candidate, index) => {
            const start = 45 + candidate.shortlist_rank * 10;
            const end = 45 + (candidate.juryRank ?? candidate.shortlist_rank) * 10;
            return (
              <g className={`rank-line rank-color-${String(index)}`} key={candidate.candidate_id}>
                <path
                  d={`M120 ${String(start)} C300 ${String(start)} 350 ${String(end)} 510 ${String(end)}`}
                />
                <circle cx="120" cy={start} r="4" />
                <circle cx="510" cy={end} r="4" />
                <circle
                  className="rank-traveler"
                  data-motion-target
                  cx="120"
                  cy={start}
                  r="6"
                  style={
                    {
                      "--travel-y": `${String(end - start)}px`,
                      animationDelay: `${String(index * 250)}ms`,
                    } as CSSProperties
                  }
                />
                <text x="525" y={end + 4}>
                  {candidate.juryRank ?? "—"}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="rank-legend">
          {examples.map((candidate, index) => (
            <button
              type="button"
              key={candidate.candidate_id}
              aria-pressed={browser.active.candidate_id === candidate.candidate_id}
              onClick={() => {
                browser.choose(candidate);
              }}
            >
              <i className={`rank-color-${String(index)}`} />
              {candidate.displayName}
              <span>
                {rank(candidate.shortlist_rank)} → {rank(candidate.juryRank)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export function EvidenceResults({ variant }: { variant: string }) {
  const browser = useCandidateBrowser();
  const motion = useDemoMotion();
  return (
    <section className={`new-results results-${variant}`}>
      <div className="section-heading">
        <h1>
          Research leads.
          <br />
          <em>With the reasoning left in.</em>
        </h1>
        <p>
          Explore a COVID-19 teaching example.
          <br />
          Choose a medicine and follow its evidence.
        </p>
      </div>
      <DemoLabel />
      <RankStory browser={browser} motion={motion} />
      <div className="results-workspace">
        <div className="records">
          <div className="records-heading">
            <h2>The research shortlist</h2>
            <span>COVID-19 · 15 sample candidates</span>
          </div>
          <RecordTools browser={browser} />
          {browser.rows.length ? (
            <div className="candidate-table-scroll">
              <table className="candidate-table">
                <thead>
                  <tr>
                    <th scope="col">Medicine / targets</th>
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
                          onClick={() => {
                            browser.choose(candidate);
                          }}
                          aria-pressed={browser.active.candidate_id === candidate.candidate_id}
                        >
                          <strong>{candidate.displayName}</strong>
                          <small>{targets(candidate)}</small>
                        </button>
                      </td>
                      <td>{rank(candidate.shortlist_rank)}</td>
                      <td>{rank(candidate.network?.rank)}</td>
                      <td>{rank(candidate.juryRank)}</td>
                      <td>
                        <span className="safety-status">
                          <Icon
                            name={
                              candidate.safety_status === "warnings_recorded" ? "flask" : "search"
                            }
                            size={12}
                          />
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
          ) : (
            <EmptyRecords browser={browser} />
          )}
          <RecordCount browser={browser} />
          <p className="fixture-note">{facts.fixture}</p>
        </div>
        {browser.rows.length > 0 && <EvidencePanel candidate={browser.active} />}
      </div>
      <MethodNotes />
    </section>
  );
}
