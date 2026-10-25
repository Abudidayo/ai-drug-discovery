import { useSequence, useWebsite } from "./model";
import { Action, Brand, Controls, Footer, Icon, Navigation, Sources } from "./shared";
import { EvidencePress } from "./visuals";
import { Workflow } from "./Workflow";
import { Results } from "./Results";

function Introduction({ go }: { go: ReturnType<typeof useWebsite>["go"] }) {
  const motion = useSequence(3, 5000);
  return (
    <>
      <section className="relay-hero" data-playing={motion.playing} data-phase={motion.phase}>
        <div className="relay-hero-copy">
          <h1>
            Good research
            <br />
            starts with
            <br />
            <span>better leads.</span>
          </h1>
          <p>
            Find existing compounds connected to a disease. Put the evidence—and the objections—on
            the same page.
          </p>
          <Action
            onClick={() => {
              go("workflow");
            }}
          >
            Follow a compound’s journey
          </Action>
        </div>
        <div className="relay-demo">
          <div className="relay-demo-title">
            <span>
              <Icon name="flask" size={17} />
              Inside the research process
            </span>
            <span>Schematic</span>
          </div>
          <EvidencePress />
          <Controls motion={motion} />
        </div>
      </section>
      <section className="relay-before-after">
        <div>
          <h2>
            A lot of clues.
            <br />A fragmented picture.
          </h2>
          <p>
            Disease links, drug targets and safety records sit across separate sources. Connecting
            them takes time.
          </p>
        </div>
        <Icon name="arrow" size={30} />
        <div>
          <h2>
            Connect. Challenge.
            <br />
            Investigate.
          </h2>
          <p>
            A protein network finds possibilities. Public evidence grounds them. Three independent
            AI reviewers challenge the shortlist.
          </p>
          <button
            type="button"
            className="text-action"
            onClick={() => {
              go("results");
            }}
          >
            Inspect an example shortlist
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </section>
      <Sources />
    </>
  );
}
export function Relay() {
  const site = useWebsite();
  return (
    <div className={`website relay relay-${site.tab}`}>
      <aside className="relay-sidebar">
        <Brand short />
        <div className="relay-project">
          <p>
            An explorer for
            <br />
            drug repurposing.
          </p>
        </div>
        <Navigation site={site} />
        <div className="relay-sidebar-bottom">
          <Icon name="network" size={24} />
          <p>
            From scattered evidence
            <br />
            to a question worth testing.
          </p>
          <span>OxHack 2026</span>
        </div>
      </aside>
      <div className="relay-body">
        <header className="relay-topbar">
          <span>
            {site.tab === "problem"
              ? "The idea"
              : site.tab === "workflow"
                ? "The process"
                : "The evidence"}
          </span>
          <span>
            <i />
            Interactive research prototype
          </span>
        </header>
        <main id="main-content" key={site.tab}>
          {site.tab === "problem" ? (
            <Introduction go={site.go} />
          ) : site.tab === "workflow" ? (
            <Workflow direction="relay" site={site} />
          ) : (
            <Results direction="relay" />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
