import { useSequence, useWebsite } from "./model";
import { Action, Brand, Controls, Footer, Icon, Navigation, Sources } from "./shared";
import { Network } from "./visuals";
import { Workflow } from "./Workflow";
import { Results } from "./Results";

function Introduction({ go }: { go: ReturnType<typeof useWebsite>["go"] }) {
  const motion = useSequence(3, 5500);
  return (
    <>
      <section className="specimen-hero" data-playing={motion.playing}>
        <div className="specimen-lead">
          <h1>
            The next clue
            <br />
            could be a<br />
            <em>known compound.</em>
          </h1>
          <p>
            A research companion for finding existing medicines connected to disease biology—and
            asking whether the evidence holds up.
          </p>
          <Action
            onClick={() => {
              go("workflow");
            }}
          >
            Follow the evidence
          </Action>
          <div className="specimen-margin-note">
            <span>A researcher’s question</span>
            <p>
              “With so many possibilities,
              <br />
              what should I investigate next?”
            </p>
          </div>
        </div>
        <figure className="specimen-plate">
          <div className="plate-heading">
            <span>Disease → biology → compound</span>
            <span>Explanatory plate</span>
          </div>
          <Network circle />
          <figcaption>
            <span className="plate-letter">A</span>
            <p>
              Finding connections is the beginning.
              <br />
              <strong>Understanding them is the work.</strong>
            </p>
          </figcaption>
          <Controls motion={motion} />
        </figure>
      </section>
      <section className="specimen-argument">
        <h2>
          Evidence is scattered.
          <br />
          <em>Curiosity shouldn’t have to be.</em>
        </h2>
        <div>
          <p>
            A disease record here. A compound target there. Separate sources make it hard to see
            which possibilities deserve attention.
          </p>
          <p>
            We connect public biomedical evidence and the physical protein network. Three
            independent AI models review the shortlist, keeping sources, objections and unknowns
            together.
          </p>
          <button
            type="button"
            className="specimen-link"
            onClick={() => {
              go("results");
            }}
          >
            Open the example research shortlist <Icon name="arrow" size={15} />
          </button>
        </div>
      </section>
      <Sources />
    </>
  );
}
export function Specimen() {
  const site = useWebsite();
  return (
    <div className={`website specimen specimen-${site.tab}`}>
      <header className="specimen-header">
        <Brand />
        <span className="specimen-edition">A field guide to drug repurposing</span>
        <span>OxHack / 2026</span>
      </header>
      <Navigation site={site} />
      <main id="main-content" key={site.tab}>
        {site.tab === "problem" ? (
          <Introduction go={site.go} />
        ) : site.tab === "workflow" ? (
          <Workflow direction="specimen" site={site} />
        ) : (
          <Results direction="specimen" />
        )}
      </main>
      <Footer />
    </div>
  );
}
