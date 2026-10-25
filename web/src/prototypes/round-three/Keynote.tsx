import { problemCopy, useNarrative } from "./narrative";
import { useSite } from "./model";
import { Brand, Tabs, Icon, Footer, Sources } from "./components";
import { ChapterNav, StoryControls } from "./story";
import { DevelopmentSource, ProblemStory } from "./ProblemStory";
import { Workflow } from "./Workflow";
import { EvidenceResults } from "./EvidenceResults";
import "./keynote-intro.css";

export function Keynote() {
  const site = useSite();
  const narrative = useNarrative();
  const chapter = problemCopy;
  return (
    <div className="r2 keynote" data-tab={site.tab}>
      {site.tab !== "workflow" && (
        <header className="keynote-header">
          <Brand />
          <Tabs tab={site.tab} go={site.go} />
          <span className="presentation-label">A new purpose for existing medicines</span>
        </header>
      )}
      <main id="main-content" tabIndex={-1} className="keynote-main">
        {site.tab === "why" ? (
          <>
            <section className="keynote-introduction">
              <div className="keynote-copy">
                <h1>
                  {chapter.title.split("\n")[0]}
                  <br />
                  <em>{chapter.title.split("\n")[1]}</em>
                </h1>
                <p>{chapter.text}</p>
                <div className="keynote-intro-actions">
                  <button
                    type="button"
                    className="keynote-story-action"
                    onClick={() => {
                      site.go("workflow");
                    }}
                  >
                    <span className="keynote-action-orbit" aria-hidden="true">
                      <Icon name="play" size={16} />
                    </span>
                    <span>See how it works</span>
                  </button>
                  <button
                    type="button"
                    className="keynote-example-action"
                    onClick={() => {
                      site.go("results");
                    }}
                  >
                  <span>Live demo</span>
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              </div>
              <div
                className="keynote-deck"
                aria-label="Animated introduction to the research problem"
              >
                <ProblemStory narrative={narrative} fullViewport />
                <div className="deck-controls">
                  <ChapterNav narrative={narrative} />
                  <StoryControls narrative={narrative} />
                </div>
              </div>
            </section>
            <DevelopmentSource />
            <div className="keynote-takeaway">
              <h2>
                Existing medicines.
                <br />
                <em>New questions to investigate.</em>
              </h2>
              <p>
                We connect disease biology, drug targets and independent AI review to help
                researchers decide what to test next.
              </p>
              <span>
                Connected evidence.
                <br />
                Traceable hypotheses.
              </span>
            </div>
            <Sources />
          </>
        ) : site.tab === "workflow" ? (
          <Workflow go={site.go} />
        ) : (
          <EvidenceResults variant="keynote" />
        )}
      </main>
      {site.tab !== "workflow" && <Footer />}
    </div>
  );
}
