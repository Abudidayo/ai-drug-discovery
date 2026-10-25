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
import "./Orbit.css";

function FigureIcon({ name, size = 18 }: { name: "info" | "file" | "warning"; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "info" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7v.2" />
        </>
      ) : name === "file" ? (
        <>
          <path d="M5 3h9l5 5v13H5zM14 3v5h5M9 12h6M9 16h6" />
        </>
      ) : (
        <>
          <path d="m12 3 10 18H2L12 3ZM12 9v5M12 17v.2" />
        </>
      )}
    </svg>
  );
}

const fieldNodes = [
  { x: 252, y: 151, target: false },
  { x: 310, y: 195, target: false },
  { x: 302, y: 275, target: false },
  { x: 229, y: 306, target: false },
  { x: 360, y: 102, target: false },
  { x: 410, y: 180, target: true },
  { x: 407, y: 286, target: false },
  { x: 347, y: 354, target: false },
  { x: 496, y: 112, target: false },
  { x: 517, y: 234, target: true },
  { x: 492, y: 351, target: true },
] as const;
const fieldLinks = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
  [4, 5],
  [5, 6],
  [6, 7],
  [4, 8],
  [5, 9],
  [6, 9],
  [6, 10],
  [8, 9],
  [9, 10],
] as const;

function DiffusionField({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={`orbit-field ${compact ? "orbit-field-compact" : ""}`}
      viewBox="0 0 650 440"
      role="img"
      aria-label="Schematic: a disease signal spreads through connected proteins, highlighting nearby drug targets. This is not a specific Random Walk with Restart result."
    >
      <g className="orbit-field-rings" fill="none">
        {[82, 155, 228].map((radius) => (
          <circle key={radius} cx="212" cy="226" r={radius} />
        ))}
      </g>
      <g className="orbit-field-links">
        <path d="M212 226 252 151M212 226 310 195M212 226 302 275M212 226 229 306" />
        {fieldLinks.map(([from, to]) => {
          const start = fieldNodes[from];
          const end = fieldNodes[to];
          return (
            <path
              key={`${String(from)}-${String(to)}`}
              d={`M${String(start.x)} ${String(start.y)} ${String(end.x)} ${String(end.y)}`}
            />
          );
        })}
      </g>
      <g fill="none" className="orbit-diffusion-waves">
        {[0, 1, 2].map((index) => (
          <circle
            key={index}
            cx="212"
            cy="226"
            r="82"
            data-motion-target
            style={{ animationDelay: `${String(index * -2.4)}s` }}
          />
        ))}
      </g>
      {fieldNodes.map((node, index) => (
        <g key={index} className={node.target ? "orbit-field-target" : "orbit-field-protein"}>
          {node.target && (
            <circle
              cx={node.x}
              cy={node.y}
              r="24"
              className="orbit-target-response"
              data-motion-target
              style={{ animationDelay: `${String(index * -0.6)}s` }}
            />
          )}
          <circle cx={node.x} cy={node.y} r={node.target ? 12 : 8} />
          {node.target && <path d={`m${String(node.x - 4)} ${String(node.y)} 3 3 5-6`} />}
        </g>
      ))}
      <g className="orbit-disease-core">
        <circle cx="212" cy="226" r="43" />
        <circle cx="201" cy="214" r="5" />
        <circle cx="224" cy="221" r="6" />
        <circle cx="209" cy="237" r="5" />
        <path d="m201 214 23 7-15 16-8-23" />
      </g>
      <g className="orbit-field-labels">
        <path d="M119 174h43l22 22M428 170l24-28h69M528 234h56" />
        <text x="37" y="166">
          Disease proteins
        </text>
        <text x="456" y="130">
          Drug target
        </text>
        <text x="550" y="257">
          Drug target
        </text>
        <text x="36" y="380" className="orbit-field-note">
          Connected human proteins
        </text>
      </g>
    </svg>
  );
}

function Why({ site }: { site: Site }) {
  return (
    <>
      <section className="orbit-intro" aria-labelledby="orbit-offer">
        <div className="orbit-intro-copy">
          <h1 id="orbit-offer">
            Existing medicines.
            <br />
            <span>New questions.</span>
          </h1>
          <p className="orbit-lead">
            Find which medicines to investigate next, with disease biology, public evidence and
            independent AI review.
          </p>
          <div className="orbit-problem-solution">
            <div>
              <h2>The problem</h2>
              <p>
                The clues are scattered across biological databases. Connecting them takes time.
              </p>
            </div>
            <div>
              <h2>The solution</h2>
              <p>Bring the clues together. Find a shortlist. Let three AI models challenge it.</p>
            </div>
          </div>
          <div className="orbit-actions">
            <Action
              onClick={() => {
                site.go("workflow");
              }}
              icon="play"
            >
              See how it works
            </Action>
            <Action
              onClick={() => {
                site.go("results");
              }}
              secondary
            >
              Explore the results
            </Action>
          </div>
          <p className="orbit-intro-limit">
            A starting point for research. Every finding needs validation.
          </p>
        </div>
        <figure
          className="orbit-diffusion-plate"
          key={site.motion.revision}
          data-playing={site.motion.playing}
        >
          <div className="orbit-figure-heading">
            <h2>Follow the disease signal</h2>
            <Playback motion={site.motion} />
          </div>
          <DiffusionField />
          <div className="orbit-field-legend">
            <span>
              <i />
              Disease proteins
            </span>
            <span>
              <i />
              Connected proteins
            </span>
            <span>
              <i />
              Drug targets
            </span>
          </div>
          <figcaption>
            Schematic of network prioritisation, not a treatment probability or a literal view of a
            specific RWR result.
          </figcaption>
        </figure>
      </section>
      <div className="orbit-source-strip">
        <Sources />
        <span>One connected research question.</span>
      </div>
      <section className="orbit-overview" aria-labelledby="orbit-route-title">
        <div>
          <h2 id="orbit-route-title">
            From scattered clues
            <br />
            to a testable question.
          </h2>
          <p>{facts.solution}</p>
        </div>
        <ol>
          <li>
            <span>Connect</span>
            <p>Map disease-associated proteins within the physical human protein network.</p>
          </li>
          <li>
            <span>Prioritise</span>
            <p>Combine 10 network candidates with 5 supported by direct disease–target evidence.</p>
          </li>
          <li>
            <span>Question</span>
            <p>Compare independent reviews, inspect sources and decide what to test next.</p>
          </li>
        </ol>
      </section>
      <div className="orbit-research-note">
        <FigureIcon name="info" size={19} />
        <p>{facts.limit}</p>
      </div>
    </>
  );
}

function CandidatePool() {
  return (
    <div className="orbit-pool">
      <div className="orbit-pool-route">
        <strong>10</strong>
        <h3>Network candidates</h3>
        <p>
          Random Walk with Restart
          <br />
          on physical STRING interactions
        </p>
        <div className="orbit-pool-dots">
          {Array.from({ length: 10 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </div>
      <div className="orbit-pool-join" aria-hidden="true">
        <span />
        <i data-motion-target />
        <span />
      </div>
      <div className="orbit-pool-result">
        <div className="orbit-pool-result-number">
          Up to <strong>15</strong>
        </div>
        <span>unique medicines</span>
        <div className="orbit-pool-union" aria-hidden="true">
          {Array.from({ length: 15 }, (_, index) => (
            <i key={index} className={index > 9 ? "evidence" : ""} />
          ))}
        </div>
        <p>
          Deduplicate and refill
          <br />
          where coverage permits
        </p>
      </div>
      <div className="orbit-pool-join orbit-pool-join-reverse" aria-hidden="true">
        <span />
        <i data-motion-target />
        <span />
      </div>
      <div className="orbit-pool-route orbit-pool-evidence">
        <strong>5</strong>
        <h3>Evidence candidates</h3>
        <p>
          Direct disease–target support
          <br />
          from Open Targets
        </p>
        <div className="orbit-pool-dots">
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCanvas() {
  return (
    <div className="orbit-review-canvas">
      <div className="orbit-evidence-packet">
        <FigureIcon name="file" size={30} />
        <strong>The same evidence</strong>
        <span>Sources · targets · safety</span>
        <p>Network ordering withheld</p>
      </div>
      <div className="orbit-review-branches" aria-hidden="true">
        <span />
        <span />
        <span />
        <i data-motion-target />
      </div>
      <div className="orbit-reviewers">
        {reviewers.map((reviewer, index) => (
          <div key={reviewer.id}>
            <span className="orbit-reviewer-mark">
              <Icon name="search" size={20} />
            </span>
            <div>
              <strong>{reviewer.display_name}</strong>
              <span>Independent Cortex review</span>
            </div>
            <span className="orbit-review-question">
              {["What supports this?", "What contradicts it?", "What is missing?"][index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutputCanvas({ site }: { site: Site }) {
  return (
    <div className="orbit-output-canvas">
      <div className="orbit-output-sheet">
        <div>
          <span>Research shortlist</span>
          <span>Illustrative fixture</span>
        </div>
        {candidates.slice(0, 3).map((candidate, index) => (
          <div key={candidate.candidate_id}>
            <span className="orbit-output-position">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{candidate.displayName}</strong>
              <small>{targets(candidate)}</small>
            </span>
            <span className="orbit-output-evidence">
              <i data-motion-target style={{ animationDelay: `${String(index * -0.7)}s` }} />
              Source evidence
            </span>
          </div>
        ))}
      </div>
      <div className="orbit-output-explainer">
        <span className="orbit-inspect-symbol">
          <Icon name="external" size={27} />
        </span>
        <h3>A question you can inspect.</h3>
        <p>Follow the source. Read the objections. Check the recorded safety concerns.</p>
        <Action
          onClick={() => {
            site.go("results");
          }}
        >
          Open the research shortlist
        </Action>
      </div>
    </div>
  );
}

function Workflow({ site }: { site: Site }) {
  const step = workflowSteps[site.tour.step] ?? workflowSteps[0];
  return (
    <>
      <section className="orbit-page-heading">
        <div>
          <h1>A research question, taking shape.</h1>
          <p>Follow the process, or choose a stage to explore.</p>
        </div>
        <TourControls site={site} />
      </section>
      <section
        className="orbit-simulation"
        aria-label="Interactive research workflow"
        data-stage={site.tour.step}
      >
        <nav className="orbit-stage-nav" aria-label="Workflow stages">
          {workflowSteps.map((item, index) => (
            <button
              type="button"
              key={item.title}
              data-workflow-step={index}
              aria-pressed={site.tour.step === index}
              onClick={() => {
                site.tour.selectStep(index);
              }}
            >
              <span>{index + 1}</span>
              <span>
                <strong>{item.short}</strong>
                <small>
                  {
                    [
                      "Connect the biology",
                      "Combine two routes",
                      "Challenge the shortlist",
                      "Inspect and investigate",
                    ][index]
                  }
                </small>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
          <p>
            Choose any stage.
            <br />
            The research stays inspectable.
          </p>
        </nav>
        <div className="orbit-simulation-main">
          <div className="orbit-question">
            <h2>{step.question}</h2>
            <p>{step.body}</p>
          </div>
          <div
            className="orbit-simulation-field"
            key={`${String(site.tour.step)}-${String(site.motion.revision)}`}
            data-playing={site.tour.playing}
          >
            {site.tour.step === 0 && (
              <div className="orbit-biology-canvas">
                <div className="orbit-biology-caption">
                  <span className="orbit-disease-pill">A disease of interest</span>
                  <h3>Start with the biology.</h3>
                  <p>Connect disease-associated proteins to the physical network they belong to.</p>
                  <div>
                    <span />
                    Disease association
                    <br />
                    <span />
                    Physical protein interaction
                  </div>
                </div>
                <DiffusionField compact />
              </div>
            )}
            {site.tour.step === 1 && <CandidatePool />}
            {site.tour.step === 2 && <ReviewCanvas />}
            {site.tour.step === 3 && <OutputCanvas site={site} />}
          </div>
          <div className="orbit-stage-output">
            <div>
              <Icon name="check" size={17} />
              <strong>{step.output}</strong>
            </div>
            <span>{step.source}</span>
          </div>
        </div>
      </section>
      <div className="orbit-workflow-footnote">
        <p>
          {site.tour.step === 0
            ? "The field is a schematic of network prioritisation, not a specific RWR output or a treatment prediction."
            : site.tour.step === 1
              ? "The selection policy targets 15 unique candidates. Limited evidence coverage can leave a smaller shortlist."
              : site.tour.step === 2
                ? "The three models receive the same evidence, blind to network ordering. Their agreement is not experimental validation."
                : facts.docking}
        </p>
        <DemoLabel />
      </div>
      <section className="orbit-workflow-next">
        <div>
          <h2>Keep the reasons, not just the ranking.</h2>
          <p>
            Network proximity, direct evidence and AI review offer different views. Researchers can
            inspect where they agree, and where they do not.
          </p>
        </div>
        <Action
          onClick={() => {
            site.go("results");
          }}
          secondary
        >
          Compare the candidates
        </Action>
      </section>
      <MethodNotes />
    </>
  );
}

const comparisonCandidates = candidates.slice(0, 4);
const rankColumns = [
  {
    label: "Proximity",
    detail: "Legacy fixture",
    getRank: (candidate: (typeof candidates)[number]) => candidate.network?.rank,
  },
  {
    label: "Direct evidence",
    detail: "Disease–target support",
    getRank: (candidate: (typeof candidates)[number]) => candidate.direct_evidence_rank,
  },
  {
    label: "AI review",
    detail: "Illustrative consensus",
    getRank: (candidate: (typeof candidates)[number]) => candidate.juryRank,
  },
];

function ParallelRanks({ browser, site }: { browser: CandidateBrowser; site: Site }) {
  const columns = rankColumns.map((column) => ({
    ...column,
    rows: [...comparisonCandidates].sort(
      (a, b) => (column.getRank(a) ?? Infinity) - (column.getRank(b) ?? Infinity),
    ),
  }));
  return (
    <figure
      className="orbit-rank-board"
      data-playing={site.motion.playing}
      key={site.motion.revision}
    >
      <div className="orbit-rank-intro">
        <h2>
          Different evidence.
          <br />
          Different perspectives.
        </h2>
        <p>Select a medicine to follow its recorded ranks.</p>
        <Playback motion={site.motion} />
      </div>
      <div className="orbit-rank-columns">
        <svg
          viewBox="0 0 900 208"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="orbit-rank-connections"
        >
          {comparisonCandidates.map((candidate, index) => {
            const [first = 61, middle = 61, last = 61] = columns.map(
              (column) =>
                column.rows.findIndex((row) => row.candidate_id === candidate.candidate_id) * 40 +
                61,
            );
            const style = {
              "--rank-mid-y": `${String(middle - first)}px`,
              "--rank-end-y": `${String(last - first)}px`,
              animationDelay: `${String(index * -1.3)}s`,
            } as CSSProperties;
            return (
              <g
                key={candidate.candidate_id}
                className={
                  browser.active.candidate_id === candidate.candidate_id ? "is-active" : ""
                }
              >
                <path d={`M120 ${String(first)} 450 ${String(middle)} 780 ${String(last)}`} />
                <circle cx="120" cy={first} r="4" data-motion-target style={style} />
              </g>
            );
          })}
        </svg>
        {columns.map((column) => (
          <div className="orbit-rank-column" key={column.label}>
            <h3>
              {column.label}
              <span>{column.detail}</span>
            </h3>
            {column.rows.map((candidate) => (
              <button
                type="button"
                className="orbit-rank-candidate"
                key={candidate.candidate_id}
                aria-pressed={browser.active.candidate_id === candidate.candidate_id}
                onClick={() => {
                  browser.setQuery("");
                  browser.choose(candidate);
                }}
              >
                <span>{candidate.displayName}</span>
                <strong>{rank(column.getRank(candidate))}</strong>
              </button>
            ))}
          </div>
        ))}
      </div>
      <figcaption>
        Four fixture candidates. Labels show recorded ranks; vertical spacing is schematic.
      </figcaption>
    </figure>
  );
}

function CandidateComparison({ first }: { first: DemoCandidate }) {
  const [secondId, setSecondId] = useState(candidates[1]?.candidate_id ?? "");
  const alternatives = candidates.filter(
    (candidate) => candidate.candidate_id !== first.candidate_id,
  );
  const second =
    alternatives.find((candidate) => candidate.candidate_id === secondId) ?? alternatives[0];
  if (!second) return null;
  const fields = [
    {
      label: "Proximity rank",
      first: rank(first.network?.rank),
      second: rank(second.network?.rank),
    },
    {
      label: "Evidence rank",
      first: rank(first.direct_evidence_rank),
      second: rank(second.direct_evidence_rank),
    },
    { label: "AI review rank", first: rank(first.juryRank), second: rank(second.juryRank) },
    { label: "Protein targets", first: targets(first), second: targets(second) },
    {
      label: "Safety",
      first: first.safety_status === "warnings_recorded" ? "Warnings recorded" : "Not evaluated",
      second: second.safety_status === "warnings_recorded" ? "Warnings recorded" : "Not evaluated",
    },
  ];
  return (
    <section className="orbit-pair-comparison" aria-label="Compare candidates">
      <div className="orbit-pair-heading">
        <h2>Look at two medicines together.</h2>
        <p>Select a table row for the first candidate. Choose any other medicine to compare.</p>
      </div>
      <div className="orbit-pair-table-wrap">
        <table className="orbit-pair-table">
          <caption className="sr-only">
            Comparison of {first.displayName} and {second.displayName}
          </caption>
          <thead>
            <tr>
              <th scope="col">Compare</th>
              <th scope="col">
                <strong>{first.displayName}</strong>
                <span>Selected in the table</span>
              </th>
              <th scope="col">
                <label>
                  <span className="sr-only">Second candidate to compare</span>
                  <select
                    aria-label="Second candidate to compare"
                    value={second.candidate_id}
                    onChange={(event) => {
                      setSecondId(event.target.value);
                    }}
                  >
                    {alternatives.map((candidate) => (
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
            {fields.map((field) => (
              <tr key={field.label}>
                <th scope="row">{field.label}</th>
                <td>{field.first}</td>
                <td>{field.second}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="orbit-pair-limit">
        Fictional fixture ranks help demonstrate comparison. Missing network data remains
        unavailable; missing safety data does not establish safety.
      </p>
    </section>
  );
}

function Results({ site }: { site: Site }) {
  const browser = useCandidateBrowser();
  return (
    <>
      <section className="orbit-page-heading orbit-results-heading">
        <div>
          <h1>A shortlist you can question.</h1>
          <p>Compare the signals. Read the sources. Choose a research question.</p>
        </div>
        <div className="orbit-fixture-status">
          <span />
          Recorded demonstration
        </div>
      </section>
      <div className="orbit-fixture-notice">
        <DemoLabel />
        <p>{facts.fixture}</p>
      </div>
      <ParallelRanks browser={browser} site={site} />
      <section className="orbit-result-workbench" aria-label="Candidate comparison and evidence">
        <div className="orbit-candidate-records">
          <div className="orbit-record-heading">
            <h2>Candidate shortlist</h2>
            <span>COVID-19 example</span>
          </div>
          <RecordTools browser={browser} />
          <div className="orbit-table-scroll">
            <table>
              <caption className="sr-only">
                Illustrative candidate ranks and recorded safety status
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
                    key={candidate.candidate_id}
                    data-candidate-id={candidate.candidate_id}
                    data-active={browser.active.candidate_id === candidate.candidate_id}
                  >
                    <td>
                      <button
                        type="button"
                        className="r2-candidate-pick"
                        aria-pressed={browser.active.candidate_id === candidate.candidate_id}
                        onClick={() => {
                          browser.choose(candidate);
                        }}
                      >
                        <strong>{candidate.displayName}</strong>
                        <span>{targets(candidate)}</span>
                      </button>
                      {candidate.known_answer && (
                        <span className="orbit-known-reference">Teaching reference</span>
                      )}
                    </td>
                    <td>{rank(candidate.network?.rank)}</td>
                    <td>{rank(candidate.direct_evidence_rank)}</td>
                    <td>{rank(candidate.juryRank)}</td>
                    <td>
                      <span
                        className={`orbit-safety ${candidate.safety_status === "warnings_recorded" ? "has-warning" : ""}`}
                      >
                        <FigureIcon name="warning" size={13} />
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
          <EmptyRecords browser={browser} />
          <RecordCount browser={browser} />
          {browser.rows.length > 0 && <CandidateComparison first={browser.active} />}
        </div>
        {browser.rows.length > 0 && (
          <aside className="orbit-evidence-inspector">
            <EvidencePanel candidate={browser.active} key={browser.active.candidate_id} />
          </aside>
        )}
      </section>
      <div className="orbit-result-explanation">
        <FigureIcon name="info" size={18} />
        <p>{facts.path}</p>
      </div>
      <MethodNotes />
    </>
  );
}

export function Orbit() {
  const site = useSite();
  return (
    <div className="r2 orbit" data-design="orbit" data-active-tab={site.tab}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="orbit-header">
        <div className="orbit-header-top">
          <button
            type="button"
            className="orbit-home"
            onClick={() => {
              site.go("why");
            }}
            aria-label="Drug repurposing explorer home"
          >
            <Brand />
          </button>
          <span className="orbit-header-note">
            <span />
            Research, with the reasoning attached.
          </span>
        </div>
        <div className="orbit-header-nav">
          <Tabs tab={site.tab} go={site.go} />
          <span>OxHack ’26</span>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <div className="orbit-content">
          {site.tab === "why" && <Why site={site} />}
          {site.tab === "workflow" && <Workflow site={site} />}
          {site.tab === "results" && <Results site={site} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
