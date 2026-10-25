import { useIllustrationPlayback, useTour } from "./hooks";
import { useState } from "react";
import { candidates, initialCandidate } from "./data";
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
import { NetworkField } from "./visuals";
import { Pipeline } from "./Pipeline";
import { Results } from "./Results";

export function Atlas() {
  const [tab, setTab] = useState<TabId>("why");
  const [selected, setSelected] = useState(initialCandidate);
  const [layer, setLayer] = useState<"all" | "disease" | "drug">("all");
  const tour = useTour();
  const illustration = useIllustrationPlayback();
  const changeTab = (next: TabId) => {
    setTab(next);
    if (next === "workflow") tour.start();
    else tour.pause();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div className="prototype atlas">
      <aside className="atlas-sidebar">
        <Logo compact />
        <div className="atlas-sidebar-intro">
          <span className="atlas-orbit-mark" aria-hidden="true" />
          <p>
            Follow a connection.
            <br />
            Find a new question.
          </p>
        </div>
        <TabNav active={tab} onChange={changeTab} vertical />
        <div className="atlas-sidebar-bottom">
          <div className="atlas-source-note">
            <span>Evidence, connected.</span>
            <p>
              Open Targets · ChEMBL
              <br />
              STRING · Reactome
            </p>
          </div>
          <DemoBadge />
        </div>
      </aside>
      <div className="atlas-workspace">
        <header className="atlas-topbar">
          <span>
            <span className="legend-dot disease-dot" />
            Disease focus
            <Icon name="chevron" size={14} />
            <strong>COVID-19</strong>
          </span>
          <span className="atlas-mode">
            <span />
            Research exploration
          </span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {tab === "why" ? (
            <>
              <div className="atlas-heading">
                <div>
                  <h1>See what connects.</h1>
                  <p>
                    Existing drugs. Shared biology.
                    <br />A new starting point for research.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    changeTab("workflow");
                  }}
                  icon="play"
                >
                  Take the guided tour
                </Button>
              </div>
              <section className="atlas-exploration">
                <div className="atlas-canvas">
                  <div className="atlas-canvas-top">
                    <div className="atlas-canvas-title">
                      <h2>A disease doesn’t exist in isolation.</h2>
                      <IllustrationControls playback={illustration} />
                    </div>
                    <div className="layer-controls" aria-label="Protein network layers">
                      {(["all", "disease", "drug"] as const).map((value) => (
                        <button
                          type="button"
                          key={value}
                          aria-pressed={layer === value}
                          onClick={() => {
                            setLayer(value);
                          }}
                        >
                          {value === "all"
                            ? "All proteins"
                            : value === "disease"
                              ? "Disease links"
                              : "Drug targets"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <NetworkField selected={selected} layer={layer} running={illustration.playing} />
                  <div className="atlas-legend">
                    <span>
                      <i className="disease-dot" />
                      Disease protein
                    </span>
                    <span>
                      <i className="drug-dot" />
                      Drug target
                    </span>
                    <span>
                      <i className="neutral-dot" />
                      Connecting protein
                    </span>
                  </div>
                  <div className="atlas-drug-picker">
                    <span>Explore a drug</span>
                    <div>
                      {candidates.slice(0, 3).map((candidate) => (
                        <button
                          key={candidate.candidate_id}
                          type="button"
                          aria-pressed={candidate.candidate_id === selected.candidate_id}
                          onClick={() => {
                            setSelected(candidate);
                          }}
                        >
                          {candidate.displayName}
                          <Icon name="arrow" size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <aside className="atlas-insight">
                  <div className="atlas-insight-icon">
                    <Icon name="network" size={23} />
                  </div>
                  <h2>
                    Could an existing
                    <br />
                    drug help here?
                  </h2>
                  <p>
                    Researchers have to connect disease biology, drug targets and safety evidence
                    scattered across different sources.
                  </p>
                  <div className="atlas-insight-rule" />
                  <span className="details-label">A connection to explore</span>
                  <h3>{selected.displayName}</h3>
                  <p>
                    Its recorded targets include{" "}
                    <strong>
                      {selected.targets
                        .slice(0, 2)
                        .map((target) => target.name)
                        .join(" and ")}
                    </strong>
                    . This network puts those targets in context.
                  </p>
                  <div className="atlas-selected-targets">
                    {selected.targets.map((target) => (
                      <span key={target.id}>{target.name}</span>
                    ))}
                  </div>
                  <p className="small-note">
                    A connection is a research lead. It does not show that a drug treats the
                    disease.
                  </p>
                  <Button
                    secondary
                    onClick={() => {
                      changeTab("results");
                    }}
                  >
                    Inspect the evidence
                  </Button>
                </aside>
              </section>
              <section className="atlas-purpose">
                <div>
                  <span className="atlas-purpose-line" />
                  <h2>
                    From scattered records
                    <br />
                    to a traceable hypothesis.
                  </h2>
                </div>
                <p>
                  We map the biology, rank existing medicines, then ask independent AI reviewers to
                  challenge the evidence. Researchers see the reasons, objections and unknowns
                  together.
                </p>
              </section>
              <SampleNotice />
            </>
          ) : tab === "workflow" ? (
            <section className="atlas-workflow">
              <div className="atlas-heading">
                <div>
                  <h1>Watch the idea take shape.</h1>
                  <p>Four stages. Every connection has a reason.</p>
                </div>
              </div>
              <Pipeline
                tour={tour}
                onResults={() => {
                  changeTab("results");
                }}
                layout="vertical"
              />
              <div className="atlas-method-note">
                <span>
                  <Icon name="network" />
                  Network ranking
                </span>
                <p>
                  Shortest-path proximity, degree-matched analysis and Random Walk with Restart
                  offer different views of biological relationships. The selected method and data
                  versions belong with each saved experiment.
                </p>
              </div>
            </section>
          ) : (
            <section className="atlas-results">
              <div className="atlas-heading">
                <div>
                  <h1>A shortlist, with context.</h1>
                  <p>Inspect the evidence behind each research lead.</p>
                </div>
              </div>
              <Results />
            </section>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
