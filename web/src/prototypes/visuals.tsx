import { useId, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./ui";
import sample from "../../../api/oxhack_api/fixtures/MONDO_0100096/experiment.json";
import { candidates, initialCandidate, reviewers } from "./data";
import type { DemoCandidate } from "./data";

const mapNodes = [
  { x: 324, y: 154, label: "TYK2", role: "disease" },
  { x: 421, y: 101, label: "IFNAR2", role: "disease" },
  { x: 453, y: 229, label: "JAK1", role: "drug" },
  { x: 551, y: 145, label: "JAK2", role: "drug" },
  { x: 606, y: 258, label: "AAK1", role: "drug" },
  { x: 355, y: 287, label: "IL6", role: "disease" },
] as const;
const smallNodes = [
  { x: 276, y: 241 },
  { x: 337, y: 58 },
  { x: 485, y: 318 },
  { x: 552, y: 49 },
  { x: 643, y: 99 },
  { x: 667, y: 189 },
  { x: 407, y: 354 },
  { x: 287, y: 330 },
  { x: 580, y: 348 },
  { x: 491, y: 49 },
];

export function ConnectionMap({
  running = false,
  compact = false,
}: {
  running?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  return (
    <svg
      className={`connection-map connection-map-desktop ${compact ? "connection-map-compact" : ""}`}
      viewBox="0 0 1000 400"
      role="img"
      aria-labelledby={id}
      data-running={running}
    >
      <title id={id}>
        An illustrative route from a disease, through connected proteins, to existing drugs worth
        investigating.
      </title>
      <g className="map-rules">
        <path d="M202 201C255 201 270 154 324 154M202 201C259 201 289 287 355 287M202 201C258 201 312 101 421 101" />
        {smallNodes.map((node, index) => (
          <path
            key={index}
            d={`M${String(node.x)} ${String(node.y)}L${String((mapNodes[index % mapNodes.length] ?? mapNodes[0]).x)} ${String((mapNodes[index % mapNodes.length] ?? mapNodes[0]).y)}`}
          />
        ))}
        <path d="m324 154 97-53 130 44 55 113-153-29-98 58-31-133 129 75 98-84M421 101l32 128M551 145l116 44M453 229l32 89" />
      </g>
      <g className="map-active-route">
        <path d="M202 201C255 201 270 154 324 154L453 229 551 145C635 145 665 132 748 132" />
      </g>
      <g className="map-drug-routes">
        <path d="M551 145C653 145 665 209 748 209M606 258C658 258 682 286 748 286" />
      </g>
      {smallNodes.map((node, index) => (
        <circle
          key={index}
          className="map-small-node"
          cx={node.x}
          cy={node.y}
          r={index % 3 === 0 ? 6 : 4}
        />
      ))}
      <g className="map-disease">
        <circle cx="153" cy="201" r="52" className="map-disease-halo" />
        <circle cx="153" cy="201" r="41" />
        <text x="153" y="198" textAnchor="middle">
          COVID-19
        </text>
        <text className="svg-detail" x="153" y="216" textAnchor="middle">
          Disease
        </text>
      </g>
      {mapNodes.map((node, index) => (
        <g
          key={node.label}
          className={`map-protein map-protein-${node.role}`}
          style={{ animationDelay: `${String(index * 55)}ms` }}
        >
          <circle cx={node.x} cy={node.y} r="16" />
          <circle cx={node.x} cy={node.y} r="5" className="map-node-core" />
          <text x={node.x} y={node.y - 28} textAnchor="middle">
            {node.label}
          </text>
        </g>
      ))}
      {["Baricitinib", "Tofacitinib", "Ruxolitinib"].map((drug, index) => (
        <g
          className={`map-drug ${index === 0 ? "map-drug-selected" : ""}`}
          key={drug}
          transform={`translate(748 ${String(104 + index * 77)})`}
        >
          <rect width="190" height="56" rx="9" />
          <g transform="translate(18 20) rotate(-35 9 8)">
            <rect width="23" height="11" rx="5.5" />
            <path d="M11.5 0v11" />
          </g>
          <text x="54" y="33">
            {drug}
          </text>
          {index === 0 && <circle cx="174" cy="12" r="4" />}
        </g>
      ))}
      <g className="map-packets">
        <circle className="packet packet-one" cx="202" cy="201" r="6" />
        <circle className="packet packet-two" cx="202" cy="201" r="6" />
        <circle className="packet packet-three" cx="202" cy="201" r="6" />
      </g>
      {!compact && (
        <g className="map-column-labels">
          <text x="153" y="375" textAnchor="middle">
            Start with a disease
          </text>
          <text x="468" y="375" textAnchor="middle">
            Connect the biology
          </text>
          <text x="841" y="375" textAnchor="middle">
            Find candidates to investigate
          </text>
        </g>
      )}
    </svg>
  );
}

const positions = sample.network.nodes.map((node, index) => {
  const ring = index % 3;
  const angle = index * 2.399963;
  return {
    ...node,
    x: node.symbol === "AAK1" ? 590 : 390 + Math.cos(angle) * (110 + ring * 85),
    y: node.symbol === "AAK1" ? 370 : 250 + Math.sin(angle) * (90 + ring * 63),
  };
});

export function NetworkField({
  selected = initialCandidate,
  running = false,
  layer = "all",
}: {
  selected?: DemoCandidate;
  running?: boolean;
  layer?: "all" | "disease" | "drug";
}) {
  const id = useId();
  const targetIds = new Set(selected.targets.map((target) => target.id));
  const targetNodes = positions.filter((node) => targetIds.has(node.id));
  return (
    <svg
      className="network-field network-field-desktop"
      viewBox="0 0 800 510"
      role="img"
      aria-labelledby={id}
      data-running={running}
    >
      <title id={id}>
        Recorded protein network. Highlighted proteins are targets of {selected.displayName}.
        Positions are illustrative; edges come from the sample network.
      </title>
      <g className="field-orbits" aria-hidden="true">
        <ellipse cx="390" cy="250" rx="120" ry="110" />
        <ellipse cx="390" cy="250" rx="205" ry="177" />
        <ellipse cx="390" cy="250" rx="285" ry="233" />
        <path d="M105 250h570M390 17v466" />
      </g>
      <g className="field-edges">
        {sample.network.edges.map((edge, index) => {
          const a = positions.find((node) => node.id === edge.source);
          const b = positions.find((node) => node.id === edge.target);
          if (!a || !b) return null;
          return (
            <line
              key={index}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={targetIds.has(a.id) || targetIds.has(b.id) ? "field-edge-active" : ""}
            />
          );
        })}
      </g>
      <g className="field-drug-links">
        {targetNodes.map((node) => (
          <path
            key={node.id}
            d={`M718 250Q${String((node.x + 718) / 2)} ${String(node.y - 40)} ${String(node.x)} ${String(node.y)}`}
          />
        ))}
      </g>
      <g className="field-signals" aria-hidden="true">
        {targetNodes.map((node, index) => {
          const dx = node.x - 718;
          const dy = node.y - 250;
          const yAt = (time: number) => 2 * (1 - time) * time * (dy - 40) + time * time * dy;
          const style = {
            "--signal-x": `${String(dx)}px`,
            "--signal-y": `${String(dy)}px`,
            "--signal-quarter-y": `${String(yAt(0.25))}px`,
            "--signal-half-y": `${String(yAt(0.5))}px`,
            "--signal-three-quarter-y": `${String(yAt(0.75))}px`,
            animationDelay: `${String(index * 700)}ms`,
          } as CSSProperties;
          return (
            <circle key={node.id} className="field-signal" cx="718" cy="250" r="5" style={style} />
          );
        })}
      </g>
      <g className="field-nodes">
        {positions.map((node, index) => {
          const active = targetIds.has(node.id);
          const diseaseNode = node.role === "disease" || node.role === "both";
          const dim = layer === "disease" ? !diseaseNode : layer === "drug" ? !active : false;
          return (
            <g
              key={node.id}
              className={`${active ? "field-target" : diseaseNode ? "field-disease" : "field-neutral"} ${dim ? "field-dim" : ""}`}
              style={{ animationDelay: `${String(index * 14)}ms` }}
            >
              {active && <circle className="field-target-halo" cx={node.x} cy={node.y} r="21" />}
              <circle cx={node.x} cy={node.y} r={active ? 10 : diseaseNode ? 7 : 4} />
              {(active || diseaseNode) && (
                <text x={node.x} y={node.y - (active ? 27 : 16)} textAnchor="middle">
                  {node.symbol}
                </text>
              )}
            </g>
          );
        })}
      </g>
      <g className="field-drug-node" transform="translate(58 0)">
        <circle cx="660" cy="250" r="27" />
        <path d="m648 249 14-9a7 7 0 0 1 8 12l-14 9a7 7 0 0 1-8-12Zm6-4 8 12" />
        <text x="660" y="300" textAnchor="middle">
          {selected.displayName}
        </text>
      </g>
      <g className="field-labels">
        <text x="32" y="38">
          Human protein network
        </text>
        <text x="32" y="486">
          Recorded connections · illustrative layout
        </text>
      </g>
    </svg>
  );
}

export function ReviewScene() {
  const id = useId();
  return (
    <svg
      className="review-scene review-scene-desktop"
      viewBox="0 0 900 370"
      role="img"
      aria-labelledby={id}
    >
      <title id={id}>
        The same evidence goes to three independent AI reviewers. Each gives a rationale, objections
        and missing evidence.
      </title>
      <g className="review-connectors">
        <path d="M335 185H415Q450 185 450 75H560M335 185h225M335 185h80q35 0 35 110h110" />
      </g>
      <g className="review-paper">
        <rect x="98" y="57" width="240" height="264" rx="10" />
        <path d="M125 100h184" />
        <text x="125" y="85" className="svg-bold">
          One evidence packet
        </text>
        <text x="125" y="130">
          Drug targets & mechanisms
        </text>
        <text x="125" y="168">
          Disease & pathway evidence
        </text>
        <text x="125" y="206">
          Safety warnings
        </text>
        <text x="125" y="244">
          Contradictions & gaps
        </text>
        <path className="review-paper-line" d="M125 144h157M125 182h137M125 220h151M125 258h117" />
        <text x="125" y="292" className="svg-detail">
          Network ranking hidden
        </text>
      </g>
      {reviewers.map((reviewer, index) => (
        <g
          key={reviewer.id}
          className="review-model"
          style={{ animationDelay: `${String(index * 70)}ms` }}
          transform={`translate(560 ${String(44 + index * 110)})`}
        >
          <circle cx="31" cy="31" r="29" />
          <text x="31" y="37" textAnchor="middle">
            {String(index + 1).padStart(2, "0")}
          </text>
          <text x="79" y="26" className="svg-bold">
            {reviewer.display_name}
          </text>
          <text x="79" y="49" className="svg-detail">
            Independent evidence review
          </text>
          <path d="m251 29 5 5 9-10" />
        </g>
      ))}
    </svg>
  );
}

export function SelectionScene({ running }: { running: boolean }) {
  return (
    <div className="selection-scene" data-running={running}>
      <div className="selection-inputs">
        <div className="selection-lane selection-network-lane">
          <div>
            <strong>10</strong>
            <span>
              Network-prioritised candidates
              <small>Random Walk with Restart · physical STRING graph</small>
            </span>
          </div>
          <div className="selection-medicines" aria-label="Ten candidates from network ranking">
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} style={{ animationDelay: `${String(index * 40)}ms` }}>
                <svg viewBox="0 0 24 14" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="22" height="12" rx="6" />
                  <path d="M12 1v12" />
                </svg>
              </span>
            ))}
          </div>
        </div>
        <div className="selection-lane selection-evidence-lane">
          <div>
            <strong>5</strong>
            <span>
              Evidence-prioritised candidates<small>Direct disease–target associations</small>
            </span>
          </div>
          <div className="selection-medicines" aria-label="Five candidates from direct evidence">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} style={{ animationDelay: `${String(index * 55)}ms` }}>
                <svg viewBox="0 0 24 14" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="22" height="12" rx="6" />
                  <path d="M12 1v12" />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="selection-merge" aria-hidden="true">
        <svg viewBox="0 0 120 230">
          <path d="M0 39h25q35 0 35 76t35 0h25M0 191h25q35 0 35-76" />
          <circle className="selection-signal" cx="0" cy="39" r="4" />
        </svg>
      </div>
      <div className="selection-output">
        <span className="selection-stack" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <strong>15</strong>
        <span>
          candidates to
          <br />
          investigate further
        </span>
        <small>
          Deduplicated. Traceable.
          <br />
          Ready for critical review.
        </small>
      </div>
      <p className="selection-note">
        Overlaps are deduplicated and refilled. Incomplete evidence or network coverage can produce
        a smaller shortlist.
      </p>
    </div>
  );
}

export function ShortlistScene() {
  const id = useId();
  return (
    <svg
      className="shortlist-scene shortlist-scene-desktop"
      viewBox="0 0 900 370"
      role="img"
      aria-labelledby={id}
    >
      <title id={id}>
        An illustrative shortlist with candidates, protein targets and review ranks. A researcher
        can inspect each candidate’s evidence.
      </title>
      <g className="shortlist-sheet">
        <rect x="130" y="30" width="640" height="310" rx="12" />
        <text x="160" y="67" className="svg-bold">
          Candidate
        </text>
        <text x="390" y="67" className="svg-bold">
          Protein targets
        </text>
        <text x="675" y="67" className="svg-bold">
          AI rank
        </text>
        <path d="M150 83h600" />
        {candidates.slice(0, 5).map((candidate, index) => (
          <g
            key={candidate.candidate_id}
            className="shortlist-visual-row"
            style={{ animationDelay: `${String(index * 55)}ms` }}
          >
            <rect
              x="146"
              y={92 + index * 47}
              width="608"
              height="40"
              rx="5"
              className={index === 0 ? "shortlist-visual-selected" : "shortlist-visual-neutral"}
            />
            <text x="160" y={118 + index * 47}>
              {candidate.displayName}
            </text>
            <text x="390" y={118 + index * 47} className="svg-detail">
              {candidate.targets
                .slice(0, 3)
                .map((target) => target.name)
                .join(" · ")}
            </text>
            <text x="698" y={118 + index * 47} textAnchor="middle">
              {candidate.juryRank ?? "—"}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function RankPlot({ selected }: { selected: DemoCandidate }) {
  const id = useId();
  const nameX = 220;
  const startX = 248;
  const endX = 548;
  return (
    <svg className="rank-plot" viewBox="0 0 700 225" role="img" aria-labelledby={id}>
      <title id={id}>
        Illustrative rank changes after independent review. Baricitinib remains at one. Ruxolitinib
        moves from two to twelve. Lower is better.
      </title>
      <g className="rank-guides">
        <path d={`M${String(startX)} 25v170M${String(endX)} 25v170`} />
      </g>
      {candidates.slice(0, 5).map((candidate, index) => {
        const startY = 34 + index * 32;
        const endY = 24 + (candidate.juryRank ?? 15) * 14;
        const active = candidate.candidate_id === selected.candidate_id;
        const style = {
          "--rank-from": `${String(startY - endY)}px`,
          animationDelay: `${String(index * 40)}ms`,
        } as CSSProperties;
        return (
          <g
            className={`rank-track ${active ? "rank-track-selected" : ""}`}
            key={candidate.candidate_id}
          >
            <text x={nameX} y={startY + 5} textAnchor="end">
              {candidate.displayName}
            </text>
            <path
              className="rank-curve"
              d={`M${String(startX)} ${String(startY)}C${String(startX + 60)} ${String(startY)} ${String(endX - 60)} ${String(endY)} ${String(endX)} ${String(endY)}`}
            />
            <circle cx={startX} cy={startY} r="4" />
            <g className="rank-end" style={style}>
              <circle cx={endX} cy={endY} r="4" />
              <text x={endX + 18} y={endY + 5}>
                {candidate.juryRank}
              </text>
            </g>
          </g>
        );
      })}
      <text x={endX} y="218" textAnchor="middle" className="svg-detail">
        Lower is better · demo ranks
      </text>
    </svg>
  );
}

export function RankShift({
  selected,
  onSelect,
}: {
  selected: DemoCandidate;
  onSelect: (candidate: DemoCandidate) => void;
}) {
  const [replay, setReplay] = useState(0);
  return (
    <div className="rank-shift">
      <div className="rank-shift-title">
        <div>
          <h3>Review changes the picture.</h3>
          <p>Proximity rank → independent AI rank</p>
        </div>
        <button
          className="quiet-control"
          type="button"
          onClick={() => {
            setReplay((value) => value + 1);
          }}
        >
          <Icon name="replay" size={13} />
          Replay rank changes
        </button>
      </div>
      <div key={replay}>
        <RankPlot selected={selected} />
      </div>
      <div className="chart-selectors" aria-label="Highlight a candidate">
        {candidates.slice(0, 5).map((candidate) => (
          <button
            type="button"
            key={candidate.candidate_id}
            aria-pressed={candidate.candidate_id === selected.candidate_id}
            onClick={() => {
              onSelect(candidate);
            }}
          >
            {candidate.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
