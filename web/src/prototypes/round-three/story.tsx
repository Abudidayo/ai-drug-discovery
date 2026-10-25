import { Playback, Icon } from "./components";
import { chapters } from "./narrative";
import type { Narrative } from "./narrative";
import { LaboratoryScene } from "./LaboratoryScene";

export function ChapterNav({ narrative }: { narrative: Narrative }) {
  return (
    <div className="chapter-nav" aria-label="Story chapters">
      {chapters.map((chapter, index) => (
        <button
          type="button"
          key={chapter.short}
          aria-pressed={narrative.chapter === index}
          onClick={(event) => {
            narrative.setChapter(index, event.detail === 0);
          }}
        >
          <span>{index + 1}</span>
          {chapter.short}
        </button>
      ))}
    </div>
  );
}

export function ResearchScene({
  chapter,
  playing,
  revision = 0,
}: {
  chapter: number;
  playing: boolean;
  revision?: number;
}) {
  return (
    <div
      className={`research-scene scene-${String(chapter)}`}
      data-playing={playing}
      key={`${String(chapter)}-${String(revision)}`}
    >
      {chapter === 0 ? (
        <>
          <LaboratoryScene />
          <span className="scene-caption">One researcher. Many disconnected clues.</span>
        </>
      ) : chapter === 1 ? (
        <ConnectionDiagram playing={playing} />
      ) : (
        <div className="outcome-scene">
          <div className="outcome-heading">
            <Icon name="flask" size={25} />
            <strong>A research shortlist</strong>
            <span>Evidence attached</span>
          </div>
          {["Disease connection", "Independent AI review", "Sources & safety questions"].map(
            (label, index) => (
              <div className="outcome-row" key={label}>
                <span
                  className="outcome-tick"
                  data-motion-target
                  style={{ animationDelay: `${String(index * 350)}ms` }}
                >
                  <Icon name="check" size={18} />
                </span>
                <span>{label}</span>
                <span className="outcome-rule" />
              </div>
            ),
          )}
          <div className="lab-question">
            <Icon name="arrow" />
            <p>
              What should we test next?<small>A hypothesis for experimental validation.</small>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConnectionDiagram({ playing = true }: { playing?: boolean }) {
  return (
    <svg
      className="connection-diagram"
      viewBox="0 0 660 380"
      role="img"
      aria-label="Illustrative disease proteins connecting to drug targets, followed by three independent AI reviewers"
      data-playing={playing}
    >
      <g className="diagram-lines" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M100 110 245 190 110 270M245 190 360 95M245 190 370 285M245 190 440 190 560 190M360 95 440 190 370 285" />
      </g>
      {(
        [
          [100, 110],
          [110, 270],
          [360, 95],
          [370, 285],
        ] as const
      ).map(([x, y], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r="29" className={index < 2 ? "disease-node" : "drug-node"} />
          <text x={x} y={y + 5} textAnchor="middle">
            {["IL6", "ACE2", "JAK1", "JAK2"][index]}
          </text>
        </g>
      ))}
      <circle cx="245" cy="190" r="44" className="network-node" />
      <text x="245" y="186" textAnchor="middle">
        Protein
      </text>
      <text x="245" y="203" textAnchor="middle">
        network
      </text>
      <circle cx="440" cy="190" r="26" className="review-node" />
      <text x="440" y="194" textAnchor="middle">
        AI ×3
      </text>
      <rect x="516" y="149" width="105" height="83" rx="7" className="shortlist-node" />
      <path
        d="M535 171h65M535 188h50M535 205h58"
        className="diagram-lines"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle r="5" className="connection-pulse" data-motion-target />
      <circle r="5" className="connection-pulse pulse-two" data-motion-target />
      <text x="105" y="328" textAnchor="middle" className="diagram-caption">
        Disease proteins
      </text>
      <text x="365" y="46" textAnchor="middle" className="diagram-caption">
        Drug targets
      </text>
      <text x="568" y="267" textAnchor="middle" className="diagram-caption">
        Research leads
      </text>
      <text x="330" y="365" textAnchor="middle" className="diagram-disclaimer">
        Illustrative connections · No causal or treatment claim
      </text>
    </svg>
  );
}
export function StoryControls({ narrative }: { narrative: Narrative }) {
  return <Playback motion={narrative.motion} />;
}
