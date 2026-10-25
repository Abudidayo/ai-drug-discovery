import { workflowSteps } from "./model";
import type { Direction, Sequence } from "./model";
import { Icon } from "./shared";

const points = Array.from({ length: 54 }, (_, i) => {
  const angle = i * 2.399963;
  const radius = 20 + Math.sqrt(i / 54) * 152;
  return {
    x: 300 + Math.cos(angle) * radius * 1.43,
    y: 198 + Math.sin(angle) * radius,
    seed: i % 13 === 0,
  };
});
const edges = points.flatMap((a, i) =>
  points
    .slice(i + 1)
    .flatMap((b, j) =>
      Math.hypot(a.x - b.x, a.y - b.y) < 82 ? [{ a, b, id: `${String(i)}-${String(j)}` }] : [],
    ),
);

export function Network({
  circle = false,
  dimensional = false,
}: {
  circle?: boolean;
  dimensional?: boolean;
}) {
  return (
    <div
      className={`biology-network ${circle ? "circular-network" : ""} ${dimensional ? "spatial-network" : ""}`}
    >
      <svg
        viewBox="0 0 600 400"
        role="img"
        aria-label="Schematic: disease-associated proteins connect through a physical protein network to existing medicines. This is an explanation, not a recorded disease network."
      >
        {dimensional && (
          <defs>
            <radialGradient id="protein-sphere" cx="30%" cy="25%">
              <stop offset="0" stopColor="#eee0ee" />
              <stop offset=".5" stopColor="#ba98c7" />
              <stop offset="1" stopColor="#675273" />
            </radialGradient>
            <radialGradient id="disease-sphere" cx="30%" cy="25%">
              <stop offset="0" stopColor="#f7d9c1" />
              <stop offset=".5" stopColor="#dca895" />
              <stop offset="1" stopColor="#995e6b" />
            </radialGradient>
          </defs>
        )}
        {circle && (
          <>
            <circle cx="300" cy="198" r="177" className="network-boundary" />
            <circle cx="300" cy="198" r="141" className="network-boundary fine" />
            <path d="M300 5v35M300 355v35M100 198h38M461 198h38" className="network-boundary" />
          </>
        )}
        <g className="network-edges">
          {edges.map(({ a, b, id }) => (
            <path key={id} d={`M${String(a.x)} ${String(a.y)}L${String(b.x)} ${String(b.y)}`} />
          ))}
        </g>
        {points.map((point, i) => (
          <g key={i} className={point.seed ? "seed-node" : "protein-node"}>
            {dimensional && (
              <ellipse
                cx={point.x + 2}
                cy={point.y + 11}
                rx={point.seed ? 11 : 6}
                ry="3"
                fill="#160f21"
                opacity=".45"
              />
            )}
            <circle
              cx={point.x}
              cy={point.y}
              r={
                point.seed
                  ? dimensional
                    ? 12
                    : 8
                  : dimensional
                    ? i % 4 === 0
                      ? 8
                      : 5
                    : i % 4 === 0
                      ? 5
                      : 3.3
              }
              style={
                dimensional
                  ? { fill: point.seed ? "url(#disease-sphere)" : "url(#protein-sphere)" }
                  : undefined
              }
            />
            {point.seed && (
              <circle
                className="node-wave"
                cx={point.x}
                cy={point.y}
                r="15"
                style={{ animationDelay: `${String(i * 90)}ms` }}
              />
            )}
          </g>
        ))}
        <path className="network-main-path" d="M110 234 188 180 278 216 356 145 449 190" />
        <g className="network-traveler" data-motion-target>
          <circle cx="110" cy="234" r="7" />
        </g>
        <g className="drug-node">
          <circle cx="449" cy="190" r="14" />
          <path d="m444 190 4 4 7-9" />
        </g>
      </svg>
      <span className="network-tag disease-tag">
        <i />
        Disease proteins
      </span>
      <span className="network-tag drug-tag">
        <i />
        Existing medicine
      </span>
      <span className="diagram-caption">Schematic network · associations, not proven effects</span>
    </div>
  );
}
function RelayMap() {
  return (
    <div className="relay-biology-map">
      <div className="relay-map-columns">
        <span>Disease</span>
        <span>Target proteins</span>
        <span>Compound</span>
      </div>
      <svg
        viewBox="0 0 570 280"
        role="img"
        aria-label="Schematic disease-associated proteins and a compound target connect through a physical protein network."
      >
        <g className="relay-map-wires">
          <path d="M90 140H170V60H270M170 140H270M170 140V220H270M320 60H385V140H470M320 140H470M320 220H385V140" />
        </g>
        <g className="relay-map-node">
          <rect x="25" y="110" width="105" height="60" rx="8" />
          <text x="77" y="145" textAnchor="middle">
            Disease
          </text>
        </g>
        {[60, 140, 220].map((y, i) => (
          <g className="relay-map-protein" key={y}>
            <rect x="252" y={y - 21} width="80" height="42" rx="5" />
            <text x="292" y={y + 4} textAnchor="middle">
              Protein {String.fromCharCode(65 + i)}
            </text>
          </g>
        ))}
        <g className="relay-map-node compound">
          <rect x="455" y="110" width="105" height="60" rx="8" />
          <text x="507" y="145" textAnchor="middle">
            Compound
          </text>
        </g>
        <g className="relay-map-signal" data-motion-target>
          <circle cx="130" cy="140" r="5" />
        </g>
      </svg>
      <p>Follow the biology. Find a possible connection.</p>
      <span className="diagram-caption">
        Schematic association · not a demonstrated drug effect
      </span>
    </div>
  );
}
export function RouteScene() {
  return (
    <div
      className="landscape-route"
      aria-label="An animated schematic connecting disease biology to existing medicines"
    >
      <svg viewBox="0 0 660 250" aria-hidden="true">
        <path d="M90 175C180 175 215 60 330 80S425 190 565 112" />
        <g className="route-traveler" data-motion-target>
          <circle cx="90" cy="175" r="6" />
        </g>
        <circle cx="90" cy="175" r="5" />
        <circle cx="330" cy="80" r="5" />
        <circle cx="565" cy="112" r="5" />
      </svg>
      <span className="landmark landmark-disease">Disease biology</span>
      <span className="landmark landmark-network">Protein network</span>
      <span className="landmark landmark-medicine">Existing medicines</span>
    </div>
  );
}
export function EvidencePress() {
  return (
    <div
      className="evidence-press"
      aria-label="Animation: separate evidence is connected, challenged and organised into a research lead"
    >
      <div className="press-inputs">
        <span>Disease biology</span>
        <span>Drug targets</span>
        <span>Safety records</span>
      </div>
      <div className="press-track">
        <i className="press-signal" aria-hidden="true" />
        <div className="evidence-ticket ticket-one" data-motion-target>
          <Icon name="network" size={22} />
          <span>Connect</span>
        </div>
        <div className="evidence-ticket ticket-two">
          <Icon name="search" size={22} />
          <span>Challenge</span>
        </div>
        <div className="evidence-ticket ticket-three">
          <Icon name="flask" size={22} />
          <span>Investigate</span>
        </div>
      </div>
      <div className="press-output">
        <span>A research lead</span>
        <small>Sources + objections + unknowns</small>
        <Icon name="arrow" size={22} />
      </div>
    </div>
  );
}
export function SelectionVisual() {
  return (
    <div className="selection-visual">
      <div className="selection-route">
        <strong>10</strong>
        <span>Physical network</span>
        <small>Random Walk with Restart</small>
        <div className="selection-dots">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${String(i * 160)}ms` }} />
          ))}
        </div>
      </div>
      <span className="selection-plus">+</span>
      <div className="selection-route direct">
        <strong>5</strong>
        <span>Direct evidence</span>
        <small>Disease–target associations</small>
        <div className="selection-dots">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${String(i * 220)}ms` }} />
          ))}
        </div>
      </div>
      <p>
        Deduplicate overlaps. Refill where coverage permits.
        <br />
        <strong>Up to 15 unique candidates.</strong>
      </p>
    </div>
  );
}
export function ReviewVisual() {
  return (
    <div className="independent-review">
      <div className="review-evidence">
        The same evidence packet<span>Network ranking withheld</span>
      </div>
      <div className="review-feed" data-motion-target />
      <div className="review-models">
        {["Reviewer A", "Reviewer B", "Reviewer C"].map((model, i) => (
          <div key={model} style={{ animationDelay: `${String(i * 350)}ms` }}>
            <Icon name="search" size={24} />
            <strong>{model}</strong>
            <span>Evidence · Safety · Gaps</span>
          </div>
        ))}
      </div>
      <p>
        Independent critiques through Snowflake Cortex.
        <br />
        Agreement and disagreement stay visible.
      </p>
    </div>
  );
}
export function OutputVisual() {
  return (
    <div className="output-visual">
      <div className="output-paper" data-motion-target>
        <div>
          <Icon name="flask" size={27} />
          <strong>A question to investigate</strong>
        </div>
        <p>Candidate medicine → target proteins → disease context</p>
        <ul>
          <li>
            <Icon name="check" size={15} />
            Read the original sources
          </li>
          <li>
            <Icon name="check" size={15} />
            Inspect objections and safety gaps
          </li>
          <li>
            <Icon name="check" size={15} />
            Compare possible next experiments
          </li>
        </ul>
        <span>Optional docking is a separate hypothesis.</span>
      </div>
    </div>
  );
}
export function StageVisual({ motion, direction }: { motion: Sequence; direction: Direction }) {
  return (
    <div
      className="stage-visual"
      key={`${String(motion.phase)}-${String(motion.revision)}`}
      data-playing={motion.playing}
    >
      {motion.phase === 0 ? (
        direction === "relay" ? (
          <RelayMap />
        ) : (
          <Network dimensional={direction === "horizon"} circle={direction === "specimen"} />
        )
      ) : motion.phase === 1 ? (
        <SelectionVisual />
      ) : motion.phase === 2 ? (
        <ReviewVisual />
      ) : (
        <OutputVisual />
      )}
    </div>
  );
}
export function StageList({ motion }: { motion: Sequence }) {
  return (
    <nav className="stage-list" aria-label="Workflow stages">
      {workflowSteps.map((step, index) => (
        <button
          type="button"
          key={step.title}
          aria-pressed={motion.phase === index}
          onClick={() => {
            motion.choose(index);
          }}
        >
          <span className="stage-number">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{step.title}</strong>
            <small>{step.short}</small>
          </span>
          <Icon name="arrow" size={16} />
        </button>
      ))}
    </nav>
  );
}
