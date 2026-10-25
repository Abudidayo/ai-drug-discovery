import { useIllustrationPlayback, useTour } from "./hooks";
import { useState } from "react";
import { candidates, diseaseTargets, reviewers } from "./data";
import type { TabId } from "./data";
import {
  Button,
  DemoBadge,
  IllustrationControls,
  Footer,
  Icon,
  Logo,
  SampleNotice,
  TabNav,
} from "./ui";
import { ConnectionMap } from "./visuals";
import { Pipeline } from "./Pipeline";
import { Results } from "./Results";

export function Workbench() {
  const [tab, setTab] = useState<TabId>("why");
  const [query, setQuery] = useState("COVID-19");
  const [invalid, setInvalid] = useState(false);
  const tour = useTour();
  const illustration = useIllustrationPlayback();
  const changeTab = (next: TabId) => {
    setTab(next);
    if (next === "workflow") tour.start();
    else tour.pause();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const runExample = () => {
    const valid = ["covid", "covid-19", "coronavirus", "sars-cov-2"].includes(
      query.trim().toLowerCase(),
    );
    if (!valid) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    changeTab("workflow");
  };
  return (
    <div className="prototype workbench">
      <header className="bench-header">
        <Logo />
        <span className="bench-project-label">Research, made explorable.</span>
        <DemoBadge />
      </header>
      <div className="bench-toolbar">
        <TabNav active={tab} onChange={changeTab} />
        <span className="bench-save-note">
          <Icon name="flask" size={15} />
          Recorded example · COVID-19
        </span>
      </div>
      <div className="bench-body">
        <aside className="bench-context">
          <div className="bench-context-title">
            <Icon name="search" size={20} />
            <h2>Start with a question.</h2>
          </div>
          <p>Which existing medicines could be worth investigating for this disease?</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              runExample();
            }}
          >
            <label htmlFor="bench-disease">Disease</label>
            <div className="bench-search">
              <Icon name="search" size={17} />
              <input
                id="bench-disease"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setInvalid(false);
                }}
                aria-invalid={invalid}
                aria-describedby="bench-disease-help"
              />
            </div>
            <p
              id="bench-disease-help"
              className={`bench-help ${invalid ? "bench-help-error" : ""}`}
            >
              {invalid
                ? "This prototype includes COVID-19 only. Try “COVID-19” to explore the example."
                : "The prototype includes one recorded COVID-19 example."}
            </p>
            <button type="submit" className="action">
              <span>Run the example</span>
              <Icon name="arrow" />
            </button>
          </form>
          <div className="bench-context-summary">
            <h3>Inside this example</h3>
            <dl>
              <div>
                <dt>Sample disease proteins</dt>
                <dd>{diseaseTargets.length}</dd>
              </div>
              <div>
                <dt>Shortlisted candidates</dt>
                <dd>{candidates.length}</dd>
              </div>
              <div>
                <dt>AI reviewers</dt>
                <dd>{reviewers.length}</dd>
              </div>
            </dl>
            <span className="small-note">
              Counts describe the teaching fixture, not the complete research dataset.
            </span>
          </div>
          <div className="bench-data-sources">
            <h3>Evidence comes first.</h3>
            <p>
              Open Targets
              <br />
              ChEMBL
              <br />
              STRING + Reactome
              <br />
              Regulatory drug records
            </p>
          </div>
        </aside>
        <main id="main-content" tabIndex={-1} className="bench-main">
          {tab === "why" ? (
            <>
              <section className="bench-intro">
                <h1>
                  Less searching.
                  <br />
                  <span>More investigating.</span>
                </h1>
                <p>
                  A unified place to connect disease biology with existing drugs—and decide what
                  deserves the next experiment.
                </p>
              </section>
              <section className="bench-problem">
                <div>
                  <h2>The challenge</h2>
                  <p>
                    The evidence is spread across databases. A promising connection can be hard to
                    spot, and even harder to evaluate in context.
                  </p>
                  <div className="bench-fragments">
                    <span>Biology</span>
                    <span>Mechanisms</span>
                    <span>Pathways</span>
                    <span>Safety</span>
                  </div>
                </div>
                <div>
                  <h2>What we built</h2>
                  <p>
                    A network-based ranking framework with independent AI review, traceable evidence
                    and optional molecular docking in one research workflow.
                  </p>
                  <ul>
                    <li>
                      <Icon name="check" />
                      See why a drug was shortlisted
                    </li>
                    <li>
                      <Icon name="check" />
                      Read objections and missing evidence
                    </li>
                    <li>
                      <Icon name="check" />
                      Compare candidates and revisit experiments
                    </li>
                  </ul>
                </div>
              </section>
              <section className="bench-mechanism">
                <div className="bench-section-heading">
                  <div>
                    <h2>Connect the dots.</h2>
                    <p>Disease → connected proteins → candidate medicines</p>
                  </div>
                  <div className="bench-section-actions">
                    <IllustrationControls playback={illustration} />{" "}
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => {
                        changeTab("workflow");
                      }}
                    >
                      Watch the workflow
                      <Icon name="play" size={15} />
                    </button>
                  </div>
                </div>
                <ConnectionMap compact running={illustration.playing} />
                <div className="bench-mechanism-note">
                  <Icon name="flask" size={17} />
                  <span>
                    The output is a prioritised research question. Lab and clinical validation still
                    come next.
                  </span>
                </div>
              </section>
              <section className="bench-preview">
                <div>
                  <h2>The outcome: a shortlist you can question.</h2>
                  <p>Rankings alongside citations, critical reviews and uncertainty.</p>
                </div>
                <Button
                  secondary
                  onClick={() => {
                    changeTab("results");
                  }}
                >
                  Inspect the shortlist
                </Button>
              </section>
              <SampleNotice />
            </>
          ) : tab === "workflow" ? (
            <>
              <div className="page-heading">
                <h1>
                  One workflow.
                  <br />
                  <span>Every reason visible.</span>
                </h1>
                <p>Follow an example from disease biology to an inspectable shortlist.</p>
              </div>
              <Pipeline
                tour={tour}
                onResults={() => {
                  changeTab("results");
                }}
                layout="compact"
              />
            </>
          ) : (
            <>
              <div className="page-heading">
                <h1>
                  Inspect. Compare.
                  <br />
                  <span>Ask the next question.</span>
                </h1>
                <p>A recorded COVID-19 example. Select any candidate to explore its sources.</p>
              </div>
              <Results showChart={false} layout="stacked" />
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
