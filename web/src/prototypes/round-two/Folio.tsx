import { useState } from "react";
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
import type { CandidateBrowser, DemoCandidate, DemoMotion, Site } from "./model";
import "./Folio.css";

function EvidenceLoom({ motion }: { motion: DemoMotion }) {
  return (
    <figure className="folio-loom" data-playing={motion.playing}>
      <div className="folio-figure-heading">
        <span>Connecting the record</span>
        <span>Evidence → research question</span>
      </div>
      <svg
        key={motion.revision}
        viewBox="0 0 660 420"
        role="img"
        aria-labelledby="folio-loom-title folio-loom-desc"
      >
        <title id="folio-loom-title">From separate records to an inspectable shortlist</title>
        <desc id="folio-loom-desc">
          Disease associations, drug targets and pathways are brought into biological context. The
          output keeps evidence, objections and safety questions attached to every candidate.
        </desc>
        <g className="folio-loom-threads" fill="none">
          <path d="M172 100H211C239 100 227 174 269 174H388C422 174 410 117 448 117H641" />
          <path d="M172 194H213C240 194 241 202 269 202H388C423 202 421 218 448 218H641" />
          <path d="M172 288H208C239 288 237 230 269 230H388C421 230 421 319 448 319H641" />
          <path d="M172 103H207C234 103 234 204 269 204H388C423 204 417 319 448 319H641" />
          <path d="M172 285H207C237 285 235 230 269 230H388C421 230 418 117 448 117H641" />
        </g>
        <g className="folio-loom-source">
          <rect x="8" y="65" width="173" height="72" />
          <path d="M19 88h13m-13 7h13m-13 7h8" />
          <text x="44" y="91" className="folio-svg-source">
            Open Targets
          </text>
          <text x="20" y="118">
            Disease–protein links
          </text>
          <rect x="8" y="159" width="173" height="72" />
          <path d="M19 182h13m-13 7h13m-13 7h8" />
          <text x="44" y="185" className="folio-svg-source">
            ChEMBL
          </text>
          <text x="20" y="212">
            Existing drug targets
          </text>
          <rect x="8" y="253" width="173" height="72" />
          <path d="M19 276h13m-13 7h13m-13 7h8" />
          <text x="44" y="279" className="folio-svg-source">
            Reactome
          </text>
          <text x="20" y="306">
            Pathway context
          </text>
        </g>
        <g className="folio-loom-context">
          <path d="M264 65v275m126-275v275" />
          <text x="327" y="90" textAnchor="middle">
            Biological
          </text>
          <text x="327" y="113" textAnchor="middle">
            context
          </text>
          <rect x="282" y="153" width="90" height="33" />
          <text x="327" y="175" textAnchor="middle" className="folio-svg-protein">
            JAK1
          </text>
          <path d="M327 186v33" />
          <circle cx="327" cy="202" r="3.5" />
          <rect x="282" y="218" width="90" height="33" />
          <text x="327" y="240" textAnchor="middle" className="folio-svg-protein">
            STAT1
          </text>
          <text x="327" y="294" textAnchor="middle" className="folio-svg-small">
            Human physical
          </text>
          <text x="327" y="311" textAnchor="middle" className="folio-svg-small">
            STRING network
          </text>
        </g>
        <g className="folio-loom-output">
          <rect x="444" y="70" width="207" height="84" />
          <path d="M637 70v14h14" />
          <text x="460" y="96" className="folio-svg-output">
            What is worth testing?
          </text>
          <text x="460" y="119">
            An existing-drug shortlist,
          </text>
          <text x="460" y="137">
            with the evidence attached.
          </text>
          <rect x="444" y="176" width="207" height="84" />
          <path d="M637 176v14h14" />
          <text x="460" y="202" className="folio-svg-output">
            What does not add up?
          </text>
          <text x="460" y="225">
            Three independent reviews.
          </text>
          <text x="460" y="243">
            Reasons, gaps and objections.
          </text>
          <rect x="444" y="282" width="207" height="84" />
          <path d="M637 282v14h14" />
          <text x="460" y="308" className="folio-svg-output">
            What should come next?
          </text>
          <text x="460" y="331">
            Inspect the source.
          </text>
          <text x="460" y="349">
            Design the next experiment.
          </text>
        </g>
        <g data-motion-target className="folio-loom-courier folio-loom-courier-one">
          <rect x="182" y="97" width="16" height="5" rx="2.5" />
        </g>
        <g data-motion-target className="folio-loom-courier folio-loom-courier-two">
          <rect x="182" y="191" width="16" height="5" rx="2.5" />
        </g>
        <g data-motion-target className="folio-loom-courier folio-loom-courier-three">
          <rect x="182" y="285" width="16" height="5" rx="2.5" />
        </g>
        <g data-motion-target className="folio-loom-readout">
          <path d="M444 70v84m0 22v84m0 22v84" />
        </g>
        <text x="8" y="401" className="folio-svg-caption">
          Source records
        </text>
        <text x="264" y="401" className="folio-svg-caption">
          Connect & challenge
        </text>
        <text x="444" y="401" className="folio-svg-caption">
          Inspectable questions
        </text>
      </svg>
      <figcaption>
        <span>Illustrative flow. Evidence you can trace in both directions.</span>
        <Playback motion={motion} />
      </figcaption>
    </figure>
  );
}

function ProblemPage({ site }: { site: Site }) {
  return (
    <>
      <section className="folio-opening" aria-labelledby="folio-opening-title">
        <div className="folio-opening-copy">
          <h1 id="folio-opening-title">A clearer next step for scattered evidence.</h1>
          <p className="folio-opening-problem">{facts.problem}</p>
          <p className="folio-opening-solution">
            <strong>One traceable shortlist.</strong> We connect the records, find existing
            medicines worth investigating, and let three independent AI reviewers challenge the
            evidence.
          </p>
          <div className="folio-actions">
            <Action
              onClick={() => {
                site.go("workflow");
              }}
            >
              Follow the research
            </Action>
            <Action
              secondary
              onClick={() => {
                site.go("results");
              }}
            >
              Inspect the example
            </Action>
          </div>
          <p className="folio-opening-limit">
            For research priorities. Every hypothesis still needs testing.
          </p>
        </div>
        <EvidenceLoom motion={site.motion} />
      </section>
      <Sources />
      <section className="folio-reading-section" aria-labelledby="folio-output-title">
        <div className="folio-section-intro">
          <h2 id="folio-output-title">More than a name at the top of a list.</h2>
          <p>
            A useful research lead should explain where it came from—and where the evidence stops.
          </p>
        </div>
        <div className="folio-output-ledger">
          <article>
            <h3>Two routes into the shortlist</h3>
            <p>
              10 from physical-network RWR. 5 from direct disease–target evidence. Deduplicated and
              refilled where coverage permits.
            </p>
          </article>
          <article>
            <h3>Reasoning you can question</h3>
            <p>
              Three models read the same cited evidence independently. Their objections stay visible
              beside their recommendations.
            </p>
          </article>
          <article>
            <h3>A source behind the claim</h3>
            <p>
              Open the evidence, compare candidates, and carry the unresolved question into
              experimental work.
            </p>
          </article>
        </div>
      </section>
      <section className="folio-reference-note">
        <div>
          <h2>A familiar example. An inspectable process.</h2>
        </div>
        <p>
          The recorded COVID-19 example uses baricitinib as a known teaching reference, not a new
          discovery. The fixture demonstrates how a researcher can inspect a candidate and challenge
          its position.
        </p>
        <Action
          secondary
          onClick={() => {
            site.go("results");
          }}
        >
          Open the research ledger
        </Action>
      </section>
      <MethodNotes />
    </>
  );
}

function MappingChapter() {
  return (
    <div className="folio-mapping-figure">
      <div className="folio-mapping-disease">
        <span>Disease record</span>
        <strong>COVID-19</strong>
        <p>Start with a question about the disease.</p>
        <span className="folio-source-note">Open Targets</span>
      </div>
      <div className="folio-mapping-index">
        <span>Disease-linked proteins</span>
        {["IL6R", "JAK1", "STAT1", "ACE2"].map((protein, index) => (
          <div key={protein}>
            <span>{protein}</span>
            <i />
            <span
              data-motion-target
              className={`folio-index-reader folio-index-reader-${String(index)}`}
            />
          </div>
        ))}
        <small>Illustrative identifiers</small>
      </div>
      <div className="folio-mapping-context">
        <span>Protein context</span>
        <div className="folio-physical-lines" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} />
          ))}
          <span data-motion-target />
        </div>
        <strong>
          Human physical
          <br />
          STRING network
        </strong>
        <p>A biological starting point for finding nearby drug targets.</p>
      </div>
      <p className="folio-figure-bottom-note">
        Association is a lead to investigate, not proof of a therapeutic mechanism.
      </p>
    </div>
  );
}

function SelectionChapter() {
  return (
    <div className="folio-selection-figure">
      <div className="folio-selection-route">
        <div className="folio-route-heading">
          <strong>10</strong>
          <span>
            Physical-network
            <br />
            Random Walk with Restart
          </span>
        </div>
        <div className="folio-selection-slips" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index}>
              <i />
              {String(index + 1).padStart(2, "0")}
            </span>
          ))}
          <i data-motion-target className="folio-selection-reader" />
        </div>
        <p>Prioritise existing drugs through their target proteins.</p>
      </div>
      <span className="folio-selection-plus" aria-hidden="true">
        +
      </span>
      <div className="folio-selection-route folio-evidence-route">
        <div className="folio-route-heading">
          <strong>5</strong>
          <span>
            Direct disease–target
            <br />
            evidence
          </span>
        </div>
        <div className="folio-selection-slips" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index}>
              <i />
              {String(index + 1).padStart(2, "0")}
            </span>
          ))}
          <i data-motion-target className="folio-selection-reader" />
        </div>
        <p>Keep a second route grounded in direct evidence.</p>
      </div>
      <div className="folio-selection-merge">
        <Icon name="arrow" size={18} />
        <div>
          <strong>Up to 15 unique candidates</strong>
          <span>
            Deduplicate overlaps. Refill where coverage permits. Report shortages explicitly.
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewChapter() {
  return (
    <div className="folio-review-figure">
      <div className="folio-review-packet">
        <span>Shared evidence packet</span>
        <strong>Sources · targets · pathways · warnings</strong>
        <span>Network order hidden</span>
      </div>
      <div className="folio-review-columns">
        {reviewers.map((reviewer, index) => (
          <div key={reviewer.id}>
            <span
              data-motion-target
              className={`folio-review-reader folio-review-reader-${String(index)}`}
            />
            <span className="folio-review-family">{reviewer.family}</span>
            <h3>{reviewer.display_name}</h3>
            <div className="folio-review-lines" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <p>
              Independent reasoning,
              <br />
              with sources and objections.
            </p>
          </div>
        ))}
      </div>
      <div className="folio-review-conclusion">
        <strong>Agreement is useful. Disagreement is evidence to inspect.</strong>
        <span>Three independent models through Snowflake Cortex</span>
      </div>
    </div>
  );
}

function InvestigationChapter({ site }: { site: Site }) {
  return (
    <div className="folio-investigation-figure">
      <div className="folio-investigation-question">
        <span>Research question</span>
        <h3>What would make this candidate worth the next experiment?</h3>
        <div className="folio-question-evidence">
          <span>Cited evidence</span>
          <span>Independent objections</span>
          <span>Safety questions</span>
        </div>
        <span data-motion-target className="folio-question-reader" />
        <Action
          secondary
          onClick={() => {
            site.go("results");
          }}
        >
          Inspect the recorded example
        </Action>
      </div>
      <div className="folio-docking-margin">
        <span>Optional, separate check</span>
        <h3>Explore a possible binding pose.</h3>
        <div className="folio-docking-sequence">
          <span>Experimental structure</span>
          <Icon name="arrow" size={15} />
          <span>Ligand + AutoDock Vina</span>
          <Icon name="arrow" size={15} />
          <span>Pose hypothesis</span>
        </div>
        <p>
          Docker-based preparation. Experimental RCSB PDB structures. Docking does not determine the
          ranking.
        </p>
      </div>
    </div>
  );
}

function WorkflowPage({ site }: { site: Site }) {
  const step = Math.min(site.tour.step, workflowSteps.length - 1);
  const chapter = workflowSteps[step] ?? workflowSteps[0];
  return (
    <>
      <section className="folio-workflow-intro">
        <h1>
          A research trail,
          <br />
          <em>not a leap of faith.</em>
        </h1>
        <div>
          <p>
            Four chapters connect the disease record to a question a researcher can inspect and
            test.
          </p>
          <TourControls site={site} />
        </div>
      </section>
      <div className="folio-workflow-body">
        <nav className="folio-chapter-rail" aria-label="Research chapters">
          {workflowSteps.map((item, index) => (
            <button
              type="button"
              key={item.title}
              data-workflow-step={index}
              aria-current={step === index ? "step" : undefined}
              aria-pressed={step === index}
              onClick={() => {
                site.tour.selectStep(index);
              }}
            >
              <span className="folio-chapter-number">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.question}</small>
              </span>
              <Icon name="arrow" size={15} />
            </button>
          ))}
          <p>The chapter tour plays automatically. Select any chapter to look more closely.</p>
        </nav>
        <section className="folio-current-chapter" aria-labelledby="folio-chapter-title">
          <div className="folio-chapter-caption">
            <span>Chapter {step + 1} of 4</span>
            <span>{chapter.source}</span>
          </div>
          <h2 id="folio-chapter-title">{chapter.question}</h2>
          <p className="folio-chapter-body">
            {step === 3
              ? "Compare candidates, trace their evidence and keep unresolved questions visible. Optional docking adds a geometric hypothesis for a later investigation."
              : chapter.body}
          </p>
          <figure
            key={`${String(step)}-${String(site.motion.revision)}`}
            className="folio-chapter-figure"
            data-stage={site.tour.step}
            data-playing={site.tour.playing}
          >
            {step === 0 ? (
              <MappingChapter />
            ) : step === 1 ? (
              <SelectionChapter />
            ) : step === 2 ? (
              <ReviewChapter />
            ) : (
              <InvestigationChapter site={site} />
            )}
            <figcaption>
              <span>Output</span>
              <strong>{chapter.output}</strong>
            </figcaption>
          </figure>
        </section>
      </div>
      <div className="folio-workflow-close">
        <p>
          Every step keeps the evidence attached. The shortlist is the beginning of an
          investigation.
        </p>
        <Action
          onClick={() => {
            site.go("results");
          }}
        >
          Read the example results
        </Action>
      </div>
      <MethodNotes />
    </>
  );
}

const ribbonExamples = [
  { name: "Ruxolitinib", note: "Close in the network. Review raises questions." },
  { name: "Tocilizumab", note: "Direct evidence changes what deserves attention." },
  { name: "Baricitinib", note: "A known teaching reference, not a discovery." },
];

function RankRibbons({ browser, motion }: { browser: CandidateBrowser; motion: DemoMotion }) {
  return (
    <figure className="folio-rank-figure" data-playing={motion.playing}>
      <div className="folio-ribbon-heading">
        <span>Read across. Then investigate.</span>
        <span>Selected examples · fictional ranks</span>
        <Playback motion={motion} />
      </div>
      <div className="folio-ribbon-labels" aria-hidden="true">
        <span>Candidate</span>
        <span>Legacy proximity</span>
        <span />
        <span>AI review</span>
        <span>Why compare?</span>
      </div>
      <div key={motion.revision} className="folio-ribbons">
        {ribbonExamples.map((example, index) => {
          const candidate = candidates.find((item) => item.displayName === example.name);
          if (!candidate) return null;
          return (
            <button
              type="button"
              className="folio-rank-ribbon"
              key={example.name}
              aria-pressed={browser.active.candidate_id === candidate.candidate_id}
              onClick={() => {
                browser.setQuery("");
                browser.choose(candidate);
              }}
            >
              <strong>{example.name}</strong>
              <span className="folio-ribbon-rank">{rank(candidate.network?.rank)}</span>
              <span className="folio-ribbon-thread">
                <i />
                <i
                  data-motion-target
                  className={`folio-ribbon-reader folio-ribbon-reader-${String(index)}`}
                />
                <Icon name="arrow" size={13} />
              </span>
              <span className="folio-ribbon-rank folio-ribbon-ai">{rank(candidate.juryRank)}</span>
              <span className="folio-ribbon-note">{example.note}</span>
            </button>
          );
        })}
      </div>
    </figure>
  );
}

function CandidateLedger({ browser }: { browser: CandidateBrowser }) {
  return (
    <div className="folio-candidate-ledger">
      <div className="folio-ledger-title">
        <h2>The candidate ledger</h2>
        <span>Select a name to inspect its record.</span>
      </div>
      <RecordTools browser={browser} />
      {browser.rows.length ? (
        <div className="folio-results-grid">
          <div className="folio-table-column">
            <table
              className="folio-table"
              aria-label="Illustrative candidate rankings and safety records"
            >
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
                    data-selected={browser.active.candidate_id === candidate.candidate_id}
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
                          {candidate.displayName}
                          <Icon name="arrow" size={13} />
                        </span>
                        <small title={targets(candidate)}>{targets(candidate)}</small>
                        {candidate.known_answer && <em>Known reference</em>}
                      </button>
                    </th>
                    <td>{rank(candidate.network?.rank)}</td>
                    <td>{rank(candidate.direct_evidence_rank)}</td>
                    <td>{rank(candidate.juryRank)}</td>
                    <td>
                      <span
                        className={`folio-safety ${candidate.safety_status === "warnings_recorded" ? "folio-safety-warning" : ""}`}
                      >
                        <i />
                        {candidate.safety_status === "warnings_recorded"
                          ? "Warnings"
                          : "Not evaluated"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <RecordCount browser={browser} />
            <p className="folio-table-note">
              Proximity and evidence ranks measure different signals. “Not evaluated” means safety
              has not been established, never “safe.”
            </p>
          </div>
          <EvidencePanel key={browser.active.candidate_id} candidate={browser.active} />
        </div>
      ) : (
        <EmptyRecords browser={browser} />
      )}
    </div>
  );
}

function ComparisonLedger({ first }: { first: DemoCandidate }) {
  const [secondId, setSecondId] = useState(
    () =>
      candidates.find((candidate) => candidate.candidate_id !== first.candidate_id)?.candidate_id,
  );
  const alternatives = candidates.filter(
    (candidate) => candidate.candidate_id !== first.candidate_id,
  );
  const second =
    alternatives.find((candidate) => candidate.candidate_id === secondId) ?? alternatives[0];
  if (!second) return null;

  const comparisons = [
    {
      label: "Legacy proximity rank",
      first: rank(first.network?.rank),
      second: rank(second.network?.rank),
    },
    {
      label: "Direct evidence rank",
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
    <section className="folio-comparison" aria-label="Compare candidates">
      <div className="folio-comparison-heading">
        <h2 id="folio-comparison-title">Read two records together.</h2>
        <p>
          The first candidate follows your table selection. Choose any other candidate to compare
          the same evidence fields side by side.
        </p>
      </div>
      <table className="folio-comparison-table">
        <caption className="sr-only">
          Comparison of {first.displayName} and {second.displayName}. Numerical ranks are fictional.
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span>Compare</span>
            </th>
            <th scope="col">
              <span>Selected in the table</span>
              <strong>{first.displayName}</strong>
            </th>
            <th scope="col">
              <label>
                <span>Second candidate to compare</span>
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
            </th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((comparison) => (
            <tr key={comparison.label}>
              <th scope="row">{comparison.label}</th>
              <td>{comparison.first}</td>
              <td>{comparison.second}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="folio-comparison-note">
        Fictional demonstration ranks. Missing proximity is unavailable; missing safety data does
        not establish safety.
      </p>
    </section>
  );
}

function ResultsPage({ site, browser }: { site: Site; browser: CandidateBrowser }) {
  return (
    <>
      <section className="folio-results-intro">
        <h1>A shortlist, open to scrutiny.</h1>
        <DemoLabel />
        <p>{facts.fixture}</p>
      </section>
      <RankRibbons browser={browser} motion={site.motion} />
      <CandidateLedger browser={browser} />
      {browser.rows.length > 0 && <ComparisonLedger first={browser.active} />}
      <section className="folio-results-afterword">
        <h2>A rank is a starting point.</h2>
        <p>
          Read the sources, compare the reviewers and check the missing information. The useful
          output is a traceable research question for a future experiment.
        </p>
      </section>
      <MethodNotes />
    </>
  );
}

export function Folio() {
  const site = useSite();
  const browser = useCandidateBrowser();
  return (
    <div className="r2 folio" data-design="folio" data-active-tab={site.tab}>
      <a className="folio-skip" href="#main-content">
        Skip to content
      </a>
      <header className="folio-header">
        <div className="folio-masthead">
          <Brand />
          <div className="folio-masthead-note">
            <span>An open research instrument</span>
            <strong>Evidence, with questions attached.</strong>
          </div>
        </div>
        <div className="folio-navigation">
          <Tabs tab={site.tab} go={site.go} />
          <span>Public evidence. Independent review.</span>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="folio-main">
        {site.tab === "why" ? (
          <ProblemPage site={site} />
        ) : site.tab === "workflow" ? (
          <WorkflowPage site={site} />
        ) : (
          <ResultsPage site={site} browser={browser} />
        )}
      </main>
      <Footer />
    </div>
  );
}
