import { useState } from "react";
import type { CSSProperties } from "react";
import {
  candidates,
  facts,
  rank,
  reviewers,
  targets,
  useCandidateBrowser,
  useSite,
  workflowSteps,
} from "./model";
import type { CandidateBrowser, DemoCandidate, Site } from "./model";
import {
  Action,
  Brand,
  DemoLabel,
  EmptyRecords,
  EvidencePanel,
  Footer,
  Icon,
  MethodNotes,
  Playback,
  RecordCount,
  RecordTools,
  Sources,
  Tabs,
  TourControls,
} from "./components";
import "./Assembly.css";

const sourceRecords = [
  { label: "Disease link", source: "Open Targets", x: -175, y: 32, rotation: -11 },
  { label: "Drug target", source: "ChEMBL", x: -157, y: 26, rotation: 9 },
  { label: "Protein link", source: "STRING", x: -184, y: -22, rotation: -7 },
  { label: "Pathway", source: "Reactome", x: -163, y: -7, rotation: 12 },
  { label: "Safety record", source: "Public evidence", x: -183, y: -42, rotation: -9 },
];

function SortingMachine({ site }: { site: Site }) {
  return (
    <figure
      className="asm-sorting"
      data-playing={site.motion.playing}
      key={site.motion.revision}
      aria-label="Scattered biomedical records are sorted into connected evidence for a research shortlist"
    >
      <div className="asm-figure-heading">
        <h2>Put the evidence to work.</h2>
        <span>From sources to questions</span>
      </div>
      <div className="asm-sortboard" aria-hidden="true">
        <div className="asm-sort-labels">
          <span>Collect</span>
          <span>Connect + review</span>
          <span>Inspect</span>
        </div>
        <div className="asm-sort-grid">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="asm-sort-source">
          <span>Different sources.</span>
          <span>One research question.</span>
        </div>
        {sourceRecords.map((record, index) => (
          <div
            key={record.label}
            className="asm-source-record"
            data-motion-target
            style={
              {
                top: `${String(74 + index * 45)}px`,
                "--from-x": `${String(record.x)}px`,
                "--from-y": `${String(record.y)}px`,
                "--from-r": `${String(record.rotation)}deg`,
                animationDelay: `${String(index * -0.12)}s`,
              } as CSSProperties
            }
          >
            <span className="asm-record-square" />
            <div>
              <strong>{record.label}</strong>
              <span>{record.source}</span>
            </div>
            <Icon name="check" size={12} />
          </div>
        ))}
        <div className="asm-sort-output">
          <span className="asm-output-title">
            Research
            <br />
            shortlist
          </span>
          {["Baricitinib", "Tofacitinib", "Ruxolitinib"].map((name, index) => (
            <span className="asm-output-row" key={name}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              {name}
            </span>
          ))}
          <span className="asm-output-note">
            Read the evidence.
            <br />
            Question the ranking.
          </span>
        </div>
        <svg className="asm-sort-arrow" viewBox="0 0 42 20" fill="none">
          <path d="M1 10h37M30 2l8 8-8 8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <figcaption>
        <span>Connected evidence. Independent AI review.</span>
        <Playback motion={site.motion} />
      </figcaption>
    </figure>
  );
}

function Why({ site }: { site: Site }) {
  return (
    <>
      <section className="asm-intro">
        <div className="asm-intro-copy">
          <h1>
            Existing medicines.
            <br />
            New research
            <br />
            <span>starting points.</span>
          </h1>
          <p>
            Disease links, drug targets and safety records are scattered. We connect them into a
            shortlist <em>researchers can inspect.</em>
          </p>
          <div className="asm-actions">
            <Action
              onClick={() => {
                site.go("workflow");
              }}
            >
              See how it works
            </Action>
            <Action
              secondary
              onClick={() => {
                site.go("results");
              }}
            >
              Inspect the demo
            </Action>
          </div>
          <div className="asm-intro-note">
            <span>For researchers</span>
            <p>From a disease to a traceable shortlist of existing medicines.</p>
          </div>
        </div>
        <SortingMachine site={site} />
      </section>
      <div className="asm-source-strip">
        <Sources />
        <span>Public evidence, kept traceable.</span>
      </div>
      <section className="asm-problem-solution" aria-label="The problem and our solution">
        <div>
          <h2>
            Too much evidence.
            <br />
            Too little connection.
          </h2>
          <p>{facts.problem}</p>
        </div>
        <div>
          <h2>
            A clear route
            <br />
            through the evidence.
          </h2>
          <p>{facts.solution}</p>
          <button
            type="button"
            onClick={() => {
              site.go("workflow");
            }}
          >
            Follow the process <Icon name="arrow" size={17} />
          </button>
        </div>
      </section>
      <section className="asm-selection-strip">
        <div
          className="asm-selection-equation"
          aria-label="10 network candidates plus 5 evidence candidates"
        >
          <span>
            10<small>network</small>
          </span>
          <b>+</b>
          <span>
            5<small>direct evidence</small>
          </span>
        </div>
        <div>
          <h2>Two routes. One inspectable shortlist.</h2>
          <p>{facts.selection}</p>
          <p>
            Three independent AI models then challenge the same evidence, without seeing the network
            order.
          </p>
        </div>
        <Action
          secondary
          onClick={() => {
            site.go("results");
          }}
        >
          Explore example results
        </Action>
      </section>
      <div className="asm-method-wrap">
        <MethodNotes />
      </div>
    </>
  );
}

function StationDiagram({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="asm-station-diagram asm-biology">
        <span>Open Targets</span>
        <span>STRING</span>
        <strong>Disease proteins</strong>
        <svg viewBox="0 0 210 44" fill="none" aria-hidden="true">
          <path d="M20 4v18h170V4M105 22v18" stroke="currentColor" />
          <rect x="99" y="34" width="12" height="8" fill="currentColor" />
        </svg>
      </div>
    );
  if (index === 1)
    return (
      <div className="asm-station-diagram asm-selection">
        <div>
          <strong>10</strong>
          <span>
            Physical-network
            <br />
            RWR
          </span>
        </div>
        <b>+</b>
        <div>
          <strong>5</strong>
          <span>
            Direct disease–
            <br />
            target evidence
          </span>
        </div>
      </div>
    );
  if (index === 2)
    return (
      <div className="asm-station-diagram asm-review">
        <span>Same evidence packet</span>
        <div>
          {reviewers.map((reviewer) => (
            <span key={reviewer.id}>
              <i />
              {reviewer.display_name}
            </span>
          ))}
        </div>
        <strong>Independent perspectives</strong>
      </div>
    );
  return (
    <div className="asm-station-diagram asm-shortlist">
      <div>
        {[1, 2, 3, 4].map((value) => (
          <span key={value}>
            <b>{String(value).padStart(2, "0")}</b>
            <i />
            <Icon name="check" size={13} />
          </span>
        ))}
      </div>
      <strong>Evidence you can inspect</strong>
    </div>
  );
}

function Workflow({ site }: { site: Site }) {
  const current = workflowSteps[site.tour.step] ?? workflowSteps[0];
  const labels = ["Disease biology", "10 + 5 selection", "Cortex review", "Research shortlist"];
  return (
    <>
      <section className="asm-workflow-heading">
        <h1>
          A research shortlist.
          <br />
          <span>Assembled in four steps.</span>
        </h1>
        <div>
          <p>
            Follow the evidence from disease biology to a question worth investigating. Select any
            station to take a closer look.
          </p>
          <TourControls site={site} />
        </div>
      </section>
      <figure
        className="asm-conveyor"
        data-playing={site.tour.playing}
        data-stage={site.tour.step}
        key={site.motion.revision}
        aria-label="Four visible workflow stations"
      >
        <div className="asm-stations">
          {workflowSteps.map((step, index) => (
            <button
              type="button"
              className="asm-station"
              data-active={site.tour.step === index}
              data-workflow-step={index}
              aria-pressed={site.tour.step === index}
              aria-label={`Step ${String(index + 1)}: ${labels[index] ?? step.title}`}
              onClick={() => {
                site.tour.selectStep(index);
              }}
              key={step.title}
            >
              <span className="asm-station-number">
                <b>{String(index + 1).padStart(2, "0")}</b>
                <Icon name="arrow" size={18} />
              </span>
              <h2>{labels[index]}</h2>
              <StationDiagram index={index} />
              <span className="asm-station-caption">{step.question}</span>
            </button>
          ))}
        </div>
        <div className="asm-conveyor-track" aria-hidden="true">
          <span data-motion-target />
          <i />
          <i />
          <i />
          <i />
        </div>
        <figcaption>
          <span>Evidence stays connected from source to shortlist.</span>
          <span>Click a station to inspect it.</span>
        </figcaption>
      </figure>
      <section className="asm-stage-detail" aria-live="polite">
        <div className="asm-stage-title">
          <span>{String(site.tour.step + 1).padStart(2, "0")} / 04</span>
          <h2>{current.title}</h2>
        </div>
        <div className="asm-stage-body">
          <p>{current.body}</p>
          {site.tour.step === 1 && (
            <p>Overlapping candidates are deduplicated and refilled where coverage permits.</p>
          )}
          {site.tour.step === 2 && (
            <p>
              Disagreement is visible. A model’s confidence is never evidence of clinical benefit.
            </p>
          )}
          {site.tour.step === 3 && (
            <p>Optional structure exploration stays separate from candidate ranking.</p>
          )}
          <div className="asm-stage-source">
            <span>Uses</span>
            <strong>{current.source}</strong>
          </div>
        </div>
        <div className="asm-stage-output">
          <span>What you get</span>
          <h3>{current.output}</h3>
          {site.tour.step === 3 ? (
            <Action
              onClick={() => {
                site.go("results");
              }}
            >
              Inspect the example
            </Action>
          ) : (
            <button
              type="button"
              onClick={() => {
                site.tour.selectStep(site.tour.step + 1);
              }}
            >
              Next station <Icon name="arrow" size={17} />
            </button>
          )}
        </div>
      </section>
      <div className="asm-workflow-note">
        <p>
          <strong>Follow a hypothesis, not a promise.</strong> Network associations suggest where to
          look. The researcher decides what to test.
        </p>
        <Sources />
      </div>
      <div className="asm-method-wrap">
        <MethodNotes />
      </div>
    </>
  );
}

function RankLadder({
  site,
  first,
  second,
}: {
  site: Site;
  first: DemoCandidate;
  second: DemoCandidate;
}) {
  const columns = [
    { label: "Proximity", a: first.network?.rank, b: second.network?.rank },
    ...reviewers.map((reviewer) => ({
      label: reviewer.display_name,
      a: first.votes.find((vote) => vote.model_id === reviewer.id)?.rank,
      b: second.votes.find((vote) => vote.model_id === reviewer.id)?.rank,
    })),
  ];
  return (
    <figure
      className="asm-rank-ladder"
      key={site.motion.revision}
      data-playing={site.motion.playing}
      aria-label={`Illustrative proximity and independent AI model ranks for ${first.displayName} and ${second.displayName}`}
    >
      <div className="asm-ladder-copy">
        <h2>
          One shortlist.
          <br />
          Different judgments.
        </h2>
        <p>Rank positions can disagree. Inspect the reasons behind them.</p>
        <div className="asm-ladder-legend">
          <span>
            <i />
            {first.displayName}
          </span>
          <span>
            <i />
            {second.displayName}
          </span>
        </div>
      </div>
      <div className="asm-ladder-chart">
        <span className="asm-ladder-traveller" data-motion-target aria-hidden="true" />
        <div className="asm-ladder-axis">
          <span>1</span>
          <span>8</span>
          <span>15</span>
        </div>
        <div className="asm-ladder-columns">
          {columns.map((column, index) => (
            <div className="asm-ladder-column" key={column.label}>
              <span className="asm-ladder-column-label">{column.label}</span>
              <div className="asm-ladder-rungs">
                <i />
                <i />
                <i />
                <i />
                <i />
                {[
                  { value: column.a, series: "a" },
                  { value: column.b, series: "b" },
                ].map((mark) =>
                  mark.value != null ? (
                    <span
                      data-motion-target
                      className={`asm-rank-mark asm-rank-${mark.series}`}
                      key={mark.series}
                      style={
                        {
                          top: `${String(((mark.value - 1) / 14) * 100)}%`,
                          "--rank-start": `${String(((8 - mark.value) / 14) * 88)}px`,
                          animationDelay: `${String(index * 0.13)}s`,
                        } as CSSProperties
                      }
                    >
                      {rank(mark.value)}
                    </span>
                  ) : (
                    <span
                      className={`asm-rank-unavailable asm-rank-${mark.series}`}
                      key={mark.series}
                    >
                      Unavailable
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption>
        <span>
          Illustrative ranks · 1 at the top, 15 at the bottom · Separate methods, not a combined
          score.
        </span>
        <Playback motion={site.motion} />
      </figcaption>
    </figure>
  );
}

function Comparison({
  first,
  second,
  setSecond,
}: {
  first: DemoCandidate;
  second: DemoCandidate;
  setSecond: (id: string) => void;
}) {
  const rows = [
    { label: "Proximity rank", a: rank(first.network?.rank), b: rank(second.network?.rank) },
    {
      label: "Evidence rank",
      a: rank(first.direct_evidence_rank),
      b: rank(second.direct_evidence_rank),
    },
    { label: "AI review rank", a: rank(first.juryRank), b: rank(second.juryRank) },
    { label: "Protein targets", a: targets(first), b: targets(second) },
    {
      label: "Safety",
      a: first.safety_status === "warnings_recorded" ? "Warnings recorded" : "Not evaluated",
      b: second.safety_status === "warnings_recorded" ? "Warnings recorded" : "Not evaluated",
    },
  ];
  return (
    <section className="asm-comparison" aria-label="Compare candidates">
      <div className="asm-comparison-heading">
        <h2>
          Put two candidates
          <br />
          side by side.
        </h2>
        <p>
          Select a row to change the first candidate. Choose a second to compare the same fields.
        </p>
      </div>
      <table>
        <caption className="sr-only">
          Comparison of {first.displayName} and {second.displayName}
        </caption>
        <thead>
          <tr>
            <th scope="col">Compare</th>
            <th scope="col">
              {first.displayName}
              <span>Selected in the table</span>
            </th>
            <th scope="col">
              <label>
                <span className="sr-only">Second candidate to compare</span>
                <select
                  aria-label="Second candidate to compare"
                  value={second.candidate_id}
                  onChange={(event) => {
                    setSecond(event.target.value);
                  }}
                >
                  {candidates
                    .filter((candidate) => candidate.candidate_id !== first.candidate_id)
                    .map((candidate) => (
                      <option key={candidate.candidate_id} value={candidate.candidate_id}>
                        {candidate.displayName}
                      </option>
                    ))}
                </select>
              </label>
              <span>Choose a comparison</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.a}</td>
              <td>{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CandidateTable({ browser }: { browser: CandidateBrowser }) {
  return (
    <div className="asm-record-table-wrap">
      <table className="asm-record-table">
        <caption className="sr-only">
          Illustrative legacy proximity candidates. Select a candidate to inspect its evidence.
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
          {browser.rows.map((candidate) => (
            <tr
              data-candidate-id={candidate.candidate_id}
              data-selected={browser.active.candidate_id === candidate.candidate_id}
              key={candidate.candidate_id}
            >
              <th scope="row">
                <button
                  type="button"
                  className="r2-candidate-pick"
                  aria-pressed={browser.active.candidate_id === candidate.candidate_id}
                  onClick={() => {
                    browser.choose(candidate);
                  }}
                >
                  <span>
                    <strong>{candidate.displayName}</strong>
                    <small>{targets(candidate)}</small>
                  </span>
                  <Icon name="arrow" size={15} />
                </button>
              </th>
              <td>{rank(candidate.network?.rank)}</td>
              <td>{rank(candidate.direct_evidence_rank)}</td>
              <td>{rank(candidate.juryRank)}</td>
              <td>
                <span className="asm-safety-cell">
                  {candidate.safety_status === "warnings_recorded" ? (
                    <>
                      <i />
                      Warnings
                    </>
                  ) : (
                    "Not evaluated"
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Results({ site }: { site: Site }) {
  const browser = useCandidateBrowser();
  const [compareId, setCompareId] = useState(
    candidates[1]?.candidate_id ?? candidates[0]?.candidate_id ?? "",
  );
  const compareCandidate =
    candidates.find(
      (candidate) =>
        candidate.candidate_id === compareId &&
        candidate.candidate_id !== browser.active.candidate_id,
    ) ??
    candidates.find((candidate) => candidate.candidate_id !== browser.active.candidate_id) ??
    browser.active;
  return (
    <>
      <section className="asm-results-heading">
        <div>
          <h1>A shortlist you can question.</h1>
          <p>Compare positions. Read the evidence. Keep the uncertainty in view.</p>
        </div>
        <span className="asm-disease-label">
          COVID-19
          <br />
          <small>Illustrative research example</small>
        </span>
      </section>
      <DemoLabel />
      <RankLadder site={site} first={browser.active} second={compareCandidate} />
      <section className="asm-results-workspace" aria-label="Inspect research candidates">
        <div className="asm-table-column">
          <div className="asm-table-title">
            <h2>Candidate records</h2>
            <span>Legacy proximity fixture</span>
          </div>
          <RecordTools browser={browser} />
          {browser.rows.length ? (
            <CandidateTable browser={browser} />
          ) : (
            <EmptyRecords browser={browser} />
          )}
          <RecordCount browser={browser} />
          <p className="asm-fixture-note">{facts.fixture}</p>
        </div>
        {browser.rows.length > 0 && (
          <aside className="asm-evidence-column">
            <EvidencePanel key={browser.active.candidate_id} candidate={browser.active} />
          </aside>
        )}
      </section>
      {browser.rows.length > 0 && (
        <Comparison first={browser.active} second={compareCandidate} setSecond={setCompareId} />
      )}
      <div className="asm-result-caveats">
        <p>
          <strong>Paths are context.</strong> {facts.path}
        </p>
        <p>
          <strong>Docking is an optional next question.</strong> {facts.docking}
        </p>
      </div>
      <div className="asm-method-wrap">
        <MethodNotes />
      </div>
    </>
  );
}

export function Assembly() {
  const site = useSite();
  return (
    <div className="r2 assembly" data-design="assembly" data-active-tab={site.tab}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="asm-header">
        <div className="asm-masthead">
          <Brand />
          <span className="asm-header-note">
            Research, made inspectable.<span>OxHack ’26</span>
          </span>
        </div>
        <div className="asm-navigation">
          <Tabs tab={site.tab} go={site.go} />
          <span>Drug repurposing, explained.</span>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {site.tab === "why" ? (
          <Why site={site} />
        ) : site.tab === "workflow" ? (
          <Workflow site={site} />
        ) : (
          <Results site={site} />
        )}
      </main>
      <Footer />
    </div>
  );
}
