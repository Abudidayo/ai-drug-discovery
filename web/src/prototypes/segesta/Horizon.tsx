import { useSequence, useWebsite } from "./model";
import { Action, Brand, Controls, Footer, Icon, Navigation, Sources } from "./shared";
import { RouteScene } from "./visuals";
import { Workflow } from "./Workflow";
import { Results } from "./Results";

function Introduction({ go }: { go: ReturnType<typeof useWebsite>["go"] }) {
  const motion = useSequence(3, 5200);
  return (
    <>
      <section className="horizon-hero" data-playing={motion.playing} data-phase={motion.phase}>
        <div
          className="horizon-art"
          role="img"
          aria-label="Original illustrated laboratory: a researcher examines a sample through a microscope beside flasks of possible compounds."
        />
        <div className="horizon-hero-content">
          <h1>
            New possibilities.
            <br />
            Within reach.
          </h1>
          <p>
            Help researchers find existing compounds
            <br />
            worth investigating for a different disease.
          </p>
          <div className="hero-actions">
            <Action
              onClick={() => {
                go("workflow");
              }}
            >
              See how it works
            </Action>
            <button
              className="text-action"
              type="button"
              onClick={() => {
                go("results");
              }}
            >
              Explore example results
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
        <div className="microscope-inspection" key={motion.revision} aria-hidden="true">
          <span className="inspection-ring" />
          <span className="compound-dot dot-a" data-motion-target />
          <span className="compound-dot dot-b" />
          <span className="compound-dot dot-c" />
        </div>
        <div className="lab-bubbles" key={`bubbles-${String(motion.revision)}`} aria-hidden="true">
          <i className="flask-bubble bubble-one" />
          <i className="flask-bubble bubble-two" />
          <i className="flask-bubble bubble-three" />
          <i className="flask-bubble bubble-four" />
        </div>
        <div className="lab-story">
          <div className="lab-story-steps" aria-label="Research story chapters">
            {["Explore a compound", "Connect its targets", "Challenge the evidence"].map(
              (label, index) => (
                <button
                  type="button"
                  key={label}
                  aria-pressed={motion.phase === index}
                  onClick={() => {
                    motion.choose(index);
                  }}
                >
                  <span />
                  {label}
                </button>
              ),
            )}
          </div>
          <p>
            {
              [
                "A possible compound is a clue. What does it act on?",
                "Connect target proteins to the biology of a disease.",
                "Keep the supporting sources and unanswered questions together.",
              ][motion.phase]
            }
          </p>
        </div>
        <div className="horizon-scene-caption">
          <span>From the lab bench to a better research question.</span>
          <small>Illustrated research story</small>
        </div>
        <div className="horizon-story-control">
          <Controls motion={motion} />
        </div>
      </section>
      <section className="horizon-problem" data-playing={motion.playing}>
        <div>
          <h2>
            The clues are out there.
            <br />
            The connections take work.
          </h2>
          <p>
            Disease biology, compound targets and safety records live in different places.
            Researchers need a clearer starting point for what to test.
          </p>
        </div>
        <div>
          <p>
            We bring public evidence into a human protein network, then ask three independent AI
            reviewers to challenge a shortlist of existing medicines.
          </p>
          <RouteScene key={motion.revision} />
          <p className="quiet-note">
            Schematic connections · a starting hypothesis for laboratory research
          </p>
        </div>
      </section>
      <Sources />
      <section className="horizon-close">
        <h2>
          Less searching in the dark.
          <br />
          More questions worth asking.
        </h2>
        <Action
          onClick={() => {
            go("workflow");
          }}
        >
          Follow the research workflow
        </Action>
      </section>
    </>
  );
}
export function Horizon() {
  const site = useWebsite();
  return (
    <div className={`website horizon horizon-page-${site.tab}`}>
      <header className="horizon-header">
        <Brand />
        <Navigation site={site} />
        <span className="header-context">A research exploration</span>
      </header>
      <main id="main-content" key={site.tab}>
        {site.tab === "problem" ? (
          <Introduction go={site.go} />
        ) : site.tab === "workflow" ? (
          <Workflow direction="horizon" site={site} />
        ) : (
          <Results direction="horizon" />
        )}
      </main>
      <Footer />
    </div>
  );
}
