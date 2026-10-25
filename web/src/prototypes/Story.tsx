import { useIllustrationPlayback, useTour } from "./hooks";
import { useState } from "react";
import type { TabId } from "./data";
import { Button, DemoBadge, IllustrationControls, Footer, Icon, Logo, TabNav } from "./ui";
import { ConnectionMap } from "./visuals";
import { Pipeline } from "./Pipeline";
import { Results } from "./Results";

export function Story() {
  const [tab, setTab] = useState<TabId>("why");
  const tour = useTour();
  const illustration = useIllustrationPlayback();
  const changeTab = (next: TabId) => {
    setTab(next);
    if (next === "workflow") tour.start();
    else tour.pause();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div className="prototype story">
      <header className="site-header">
        <div className="story-brand">
          <Logo />
          <DemoBadge />
        </div>
        <TabNav active={tab} onChange={changeTab} />
      </header>
      <main id="main-content" tabIndex={-1} className="story-main">
        {tab === "why" ? (
          <>
            <section className="story-intro">
              <h1>
                New possibilities.
                <br />
                <span>Existing medicines.</span>
              </h1>
              <p>
                Connect disease biology with approved medicines.
                <br className="desktop-break" /> Give researchers a clearer place to start.
              </p>
              <div className="hero-actions">
                <Button
                  onClick={() => {
                    changeTab("workflow");
                  }}
                  icon="play"
                >
                  See how it works
                </Button>
                <Button
                  secondary
                  onClick={() => {
                    changeTab("results");
                  }}
                  icon={false}
                >
                  Explore an example
                </Button>
              </div>
            </section>
            <section className="story-map" aria-label="From disease to a research question">
              <div className="story-map-top">
                <span>
                  <span className="legend-dot disease-dot" />
                  Disease proteins
                  <span className="legend-dot drug-dot" />
                  Drug targets
                  <span className="legend-line" />A possible connection
                </span>
                <IllustrationControls playback={illustration} />
              </div>
              <ConnectionMap running={illustration.playing} />
              <div className="story-map-bottom">
                <span>One question. Connected evidence. New hypotheses.</span>
                <span>Illustrative COVID-19 example</span>
              </div>
            </section>
            <div className="source-strip">
              <span>Built on public biomedical evidence</span>
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
            <section className="problem-section">
              <div>
                <h2>
                  The clues exist.
                  <br />
                  <span>They’re scattered.</span>
                </h2>
                <p>
                  Disease research, drug mechanisms and safety evidence live across different
                  databases. Researchers need to connect that information before deciding what to
                  test.
                </p>
              </div>
              <div className="before-after">
                <div className="before-row">
                  <span className="comparison-label">The problem</span>
                  <div className="scattered-sources">
                    <span>Disease links</span>
                    <span>Drug targets</span>
                    <span>Pathways</span>
                    <span>Safety records</span>
                  </div>
                  <p>Separate records. A difficult first step.</p>
                </div>
                <div className="after-row">
                  <span className="comparison-label">Our approach</span>
                  <div className="connected-sources">
                    <span>Connected biology</span>
                    <Icon name="arrow" />
                    <span>Critical AI review</span>
                    <Icon name="arrow" />
                    <strong>A traceable shortlist</strong>
                  </div>
                  <p>One place to explore the evidence and the gaps.</p>
                </div>
              </div>
            </section>
            <section className="story-outcome">
              <div>
                <h2>
                  A better research question.
                  <br />
                  Not a promised cure.
                </h2>
                <p>
                  The outcome is an inspectable shortlist: why a drug appeared, what supports it,
                  where reviewers disagree, and what is still unknown.
                </p>
              </div>
              <Button
                onClick={() => {
                  changeTab("results");
                }}
              >
                Open the example shortlist
              </Button>
            </section>
          </>
        ) : tab === "workflow" ? (
          <section className="story-workflow">
            <div className="page-heading">
              <h1>Follow the evidence.</h1>
              <p>From a disease to a question worth testing. Take it one step at a time.</p>
            </div>
            <Pipeline
              tour={tour}
              onResults={() => {
                changeTab("results");
              }}
            />
          </section>
        ) : (
          <section className="story-results">
            <div className="page-heading">
              <div>
                <h1>Ideas worth investigating.</h1>
                <p>A COVID-19 teaching example, with the reasoning left in.</p>
              </div>
              <span className="disease-chip">
                <span className="legend-dot disease-dot" />
                COVID-19
              </span>
            </div>
            <Results />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
