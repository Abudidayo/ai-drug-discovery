/*
 * PROTOTYPE, throwaway: four introductions for `/`, switchable with `?variant=1` to `?variant=4`.
 * Variant 1 shows by default. All four share one copy deck, one pair of sourced figures and one
 * illustrative network; only their composition differs. Each also borrows from Jessica's Half
 * Life site (Jessica-mak/half-life-ui): her animated lab, details of her story illustrations and
 * her taped labels, with soft colour behind. The winner is rewritten properly (copy into
 * src/copy/en.ts, tests) and the rest stay on the prototype branch.
 */
import { type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { Marker } from "../../charts/Marker";
import { copy } from "../../copy/en";
import { crops } from "../../intro/content";
import { useCountUp } from "../../intro/playback";
import { WorkflowMap } from "../../intro/WorkflowMap";
import { Backdrop, CropImage, LabPlate, SourceMarquee, Sticker } from "../../intro/Showpieces";
import { PageFrame } from "../PageFrame";
import { PrototypeSwitcher } from "../PrototypeSwitcher";
import { usePrototypeVariant } from "../prototypeVariant";
import { EXPLORE_PATH } from "../steps";
import styles from "./IntroPage.prototype.module.css";

interface IntroVariant {
  key: string;
  name: string;
  View: () => ReactNode;
}

const VARIANTS: readonly [IntroVariant, ...IntroVariant[]] = [
  { key: "1", name: "Scientific editorial", View: Editorial },
  { key: "2", name: "Network study", View: NetworkStudy },
  { key: "3", name: "Evidence plate", View: EvidencePlate },
  { key: "4", name: "Institutional modern", View: Institutional },
];

/* Shared copy: every variant says exactly this, in its own arrangement. */

interface Source {
  label: string;
  href: string;
}

interface Statistic {
  lead?: string;
  value: string;
  unit?: string;
  text: string;
  source: Source;
}

const intro = {
  title: "Repurposing existing drugs for diseases",
  problem: [
    {
      value: "10+",
      unit: "years",
      text: "to develop a promising molecule into an approved drug.",
      source: {
        label: "NCATS, 2023",
        href: "https://ncats.nih.gov/sites/default/files/2023-11/NCATS-2023_Drug-Repurposing-Fact-Sheet-508.pdf",
      },
    },
    {
      lead: "Nearly",
      value: "90%",
      text: "of treatment candidates entering clinical trials fail.",
      source: {
        label: "NCATS",
        href: "https://ncats.nih.gov/about/ncats-overview/strategic-plan/goal-1",
      },
    },
  ] satisfies Statistic[],
  solution:
    "Half Life integrates biological network analysis and AI evidence review to prioritise existing drugs for further research.",
  start: "Start exploring",
  limit: "Research hypotheses, not proven treatments.",
  method: [
    {
      title: "Disease proteins",
      text: "Proteins linked to the disease, from published genetic and clinical evidence.",
    },
    {
      title: "Network ranking",
      text: "Approved drugs ranked by how closely their targets connect to those proteins.",
    },
    {
      title: "Evidence review",
      text: "Three AI models weigh the evidence for each candidate, independently.",
    },
    {
      title: "Shortlist",
      text: "Drugs worth further research, each with the reasons behind it.",
    },
  ],
  sourcesLabel: "Sources",
  schematic: "Illustrative schematic, not real data.",
  example: "Illustrative example, not a real result.",
  rankedBy: "Ranked by closeness",
  tagline: "A second life for existing medicines",
  clues: "The clues exist. They’re scattered.",
  notAnLlm: "Ranked by graph maths, not by an AI",
  builtOn: ["Open Targets", "STRING", "ChEMBL", "Snowflake Cortex", "TigerData"],
  steps: (count: number) => `${String(count)} ${count === 1 ? "step" : "steps"}`,
  models: ["Model 1", "Model 2", "Model 3"],
  decisions: { investigate: "Investigate", watch: "Watch", deprioritise: "Set aside" },
};

type Decision = keyof typeof intro.decisions;

/** The illustrative jury: one row per drug in consensus order, one rank and call per model. */
const BALLOT: { drug: string; votes: [number, Decision][] }[] = [
  {
    drug: "Drug A",
    votes: [
      [1, "investigate"],
      [1, "investigate"],
      [2, "investigate"],
    ],
  },
  {
    drug: "Drug B",
    votes: [
      [2, "watch"],
      [3, "investigate"],
      [1, "watch"],
    ],
  },
  {
    drug: "Drug C",
    votes: [
      [3, "deprioritise"],
      [2, "watch"],
      [3, "deprioritise"],
    ],
  },
];

export function IntroPage() {
  const variant = usePrototypeVariant(VARIANTS);
  const { View } = variant;
  return (
    <PageFrame flow="document">
      <title>{copy.product}</title>
      <View />
      <PrototypeSwitcher variants={VARIANTS} />
    </PageFrame>
  );
}

/* Small shared pieces. Each variant arranges them; none sets the page layout. */

function Start({ className }: { className?: string }) {
  return (
    <Link to={EXPLORE_PATH} className={`${styles.start ?? ""} ${className ?? ""}`}>
      {intro.start}
      <svg className={styles.startArrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h15M13 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/** The figure counts up from zero as the page opens; its accessible text is the final value. */
function Figure({ statistic, className }: { statistic: Statistic; className?: string }) {
  const [, number = "0", suffix = ""] = /^(\d+)(.*)$/.exec(statistic.value) ?? [];
  const shown = useCountUp(Number(number));
  return (
    <span className={`${styles.figure ?? ""} ${className ?? ""}`}>
      {statistic.lead !== undefined && <span className={styles.figureLead}>{statistic.lead} </span>}
      <span className={styles.figureValue}>
        <span className={styles.visuallyHidden}>{statistic.value}</span>
        <span aria-hidden="true">
          {shown}
          {suffix}
        </span>
      </span>
      {statistic.unit !== undefined && <span className={styles.figureUnit}> {statistic.unit}</span>}
    </span>
  );
}

function SourceLink({ source }: { source: Source }) {
  return (
    <a className={styles.source} href={source.href}>
      {source.label}
    </a>
  );
}

function Reveal({
  order,
  className,
  children,
}: {
  order: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${styles.reveal ?? ""} ${className ?? ""}`}
      style={{ "--order": order } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* The illustrative protein network: generated once from a fixed seed, so it is the same on
   every visit and in every variant. */

interface Network {
  width: number;
  height: number;
  nodes: { x: number; y: number }[];
  edges: [number, number][];
  disease: Set<number>;
  route: number[];
  drugs: { name: string; target: number; steps: number; x: number; y: number }[];
}

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNetwork(): Network {
  const width = 640;
  const height = 480;
  const margin = 40;
  const next = seeded(23);
  const nodes: { x: number; y: number }[] = [];
  for (let tries = 0; nodes.length < 58 && tries < 40000; tries += 1) {
    const x = margin + next() * (width - 2 * margin);
    const y = margin + next() * (height - 2 * margin);
    const dx = (x - width / 2) / (width / 2 - margin);
    const dy = (y - height / 2) / (height / 2 - margin);
    if (dx * dx + dy * dy > 1) continue;
    if (nodes.some((node) => Math.hypot(node.x - x, node.y - y) < 52)) continue;
    nodes.push({ x, y });
  }
  const at = (i: number) => nodes[i] ?? { x: 0, y: 0 };
  const gap = (i: number, j: number) => Math.hypot(at(i).x - at(j).x, at(i).y - at(j).y);

  // A minimum spanning tree keeps the network in one piece; nearest neighbours add the mesh.
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  const link = (i: number, j: number) => {
    const key = i < j ? `${String(i)}-${String(j)}` : `${String(j)}-${String(i)}`;
    if (i === j || seen.has(key)) return;
    seen.add(key);
    edges.push([i, j]);
  };
  const inTree = new Set([0]);
  while (inTree.size < nodes.length) {
    let best: [number, number, number] = [0, 0, Infinity];
    for (const i of inTree) {
      nodes.forEach((_, j) => {
        if (!inTree.has(j) && gap(i, j) < best[2]) best = [i, j, gap(i, j)];
      });
    }
    link(best[0], best[1]);
    inTree.add(best[1]);
  }
  nodes.forEach((_, i) => {
    const nearest = nodes
      .map((__, j) => j)
      .filter((j) => j !== i)
      .sort((a, b) => gap(i, a) - gap(i, b));
    for (const j of nearest.slice(0, next() < 0.3 ? 2 : 1)) if (gap(i, j) < 80) link(i, j);
  });

  const neighbours = nodes.map(() => [] as number[]);
  for (const [a, b] of edges) {
    neighbours[a]?.push(b);
    neighbours[b]?.push(a);
  }

  // Disease proteins: a close-knit module right of centre.
  const byDistanceTo = (x: number, y: number) =>
    nodes
      .map((_, i) => i)
      .sort((a, b) => Math.hypot(at(a).x - x, at(a).y - y) - Math.hypot(at(b).x - x, at(b).y - y));
  const disease = new Set(byDistanceTo(width * 0.7, height * 0.42).slice(0, 6));

  const hops = nodes.map(() => Infinity);
  const parent = nodes.map(() => -1);
  const queue = [...disease];
  for (const i of disease) hops[i] = 0;
  // Breadth first: the queue grows as it is read.
  for (const i of queue) {
    for (const j of neighbours[i] ?? []) {
      if (hops[j] !== Infinity) continue;
      hops[j] = (hops[i] ?? 0) + 1;
      parent[j] = i;
      queue.push(j);
    }
  }

  // Three drugs: one target two steps from the module, one four, one as far as it gets.
  const leftmost = (candidates: number[]) => candidates.sort((a, b) => at(a).x - at(b).x)[0] ?? 0;
  const atHops = (count: number) =>
    leftmost(nodes.map((_, i) => i).filter((i) => hops[i] === count));
  const farthest = Math.max(...hops.filter(Number.isFinite));
  const targets = [atHops(2), atHops(4), atHops(farthest)];
  const route = [targets[0] ?? 0];
  while ((parent[route[route.length - 1] ?? 0] ?? -1) >= 0)
    route.push(parent[route[route.length - 1] ?? 0] ?? 0);

  const drugs = targets.map((target, index) => {
    const node = at(target);
    const away = Math.atan2(node.y - height / 2, node.x - width / 2);
    return {
      name: `Drug ${"ABC"[index] ?? ""}`,
      target,
      steps: hops[target] ?? 0,
      x: node.x + Math.cos(away) * 30,
      y: node.y + Math.sin(away) * 30,
    };
  });

  return { width, height, nodes, edges, disease, route, drugs };
}

const NETWORK = buildNetwork();

function NetworkPlot({ labels = false, className }: { labels?: boolean; className?: string }) {
  const network = NETWORK;
  const { nodes, edges, disease, route, drugs } = network;
  const at = (i: number) => nodes[i] ?? { x: 0, y: 0 };
  const targets = new Set(drugs.map((drug) => drug.target));
  const routeD = route
    .map((i, n) => `${n === 0 ? "M" : "L"}${at(i).x.toFixed(1)} ${at(i).y.toFixed(1)}`)
    .join("");
  const module = [...disease].map(at);
  const moduleTop = module.reduce(
    (top, node) => (node.y < top.y ? node : top),
    module[0] ?? { x: 0, y: 0 },
  );

  return (
    <svg
      className={`${styles.network ?? ""} ${className ?? ""}`}
      viewBox={`0 0 ${String(network.width)} ${String(network.height)}`}
      role="img"
      aria-label={`${intro.schematic} Proteins as dots joined by their interactions; disease proteins in orange, drug targets in blue, and the shortest route from Drug A’s target to a disease protein in green.`}
    >
      <g className={styles.edges}>
        {edges.map(([a, b]) => (
          <line
            key={`${String(a)}-${String(b)}`}
            x1={at(a).x}
            y1={at(a).y}
            x2={at(b).x}
            y2={at(b).y}
          />
        ))}
      </g>
      <path className={styles.route} d={routeD} pathLength={1} />
      {drugs.map((drug) => (
        <line
          key={drug.name}
          className={styles.binding}
          x1={drug.x}
          y1={drug.y}
          x2={at(drug.target).x}
          y2={at(drug.target).y}
        />
      ))}
      <g>
        {nodes.map((node, i) => {
          const role = disease.has(i)
            ? "disease"
            : targets.has(i)
              ? "target"
              : route.includes(i)
                ? "route"
                : "protein";
          return (
            <circle
              key={i}
              className={styles.node}
              data-role={role}
              cx={node.x}
              cy={node.y}
              r={role === "protein" ? 5 : 6.5}
            />
          );
        })}
      </g>
      {drugs.map((drug) => (
        <g key={drug.name}>
          <rect
            className={styles.drug}
            x={drug.x - 5}
            y={drug.y - 5}
            width={10}
            height={10}
            rx={1}
          />
          {labels && (
            <text
              className={styles.plotLabel}
              x={drug.x + (drug.x < at(drug.target).x ? -11 : 11)}
              y={drug.y + 4}
              textAnchor={drug.x < at(drug.target).x ? "end" : "start"}
            >
              {drug.name}
            </text>
          )}
        </g>
      ))}
      {labels && (
        <text className={styles.plotLabel} x={moduleTop.x} y={moduleTop.y - 16} textAnchor="middle">
          Disease proteins
        </text>
      )}
    </svg>
  );
}

function NetworkKey() {
  return (
    <ul className={styles.key}>
      <li>
        <span className={styles.keyDot} data-role="disease" aria-hidden="true" />
        Disease protein
      </li>
      <li>
        <span className={styles.keyDot} data-role="target" aria-hidden="true" />
        Drug target
      </li>
      <li>
        <span className={styles.keyLine} aria-hidden="true" />
        Shortest route
      </li>
    </ul>
  );
}

function Ranking({ className }: { className?: string }) {
  const { drugs } = NETWORK;
  const longest = Math.max(...drugs.map((drug) => drug.steps));
  return (
    <ol className={`${styles.ranking ?? ""} ${className ?? ""}`}>
      {drugs.map((drug, index) => (
        <li key={drug.name}>
          <span className={styles.rankingPlace}>{index + 1}</span>
          <span className={styles.rankingDrug}>{drug.name}</span>
          <span className={styles.rankingBar} aria-hidden="true">
            <span style={{ width: `${String((drug.steps / longest) * 100)}%` }} />
          </span>
          <span className={styles.rankingSteps}>{intro.steps(drug.steps)}</span>
        </li>
      ))}
    </ol>
  );
}

function Ballot({ className }: { className?: string }) {
  return (
    <table className={`${styles.ballot ?? ""} ${className ?? ""}`}>
      <thead>
        <tr>
          <td />
          {intro.models.map((model, index) => (
            <th key={model} scope="col">
              <Marker index={index} />
              <span className={styles.visuallyHidden}>{model}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {BALLOT.map((row) => (
          <tr key={row.drug}>
            <th scope="row">{row.drug}</th>
            {row.votes.map(([rank, decision], index) => (
              <td key={index}>
                <span
                  className={styles.tile}
                  data-decision={decision}
                  title={intro.decisions[decision]}
                >
                  {rank}
                  <span className={styles.visuallyHidden}>, {intro.decisions[decision]}</span>
                </span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BallotKey() {
  return (
    <ul className={styles.key}>
      {(Object.keys(intro.decisions) as Decision[]).map((decision) => (
        <li key={decision}>
          <span className={styles.swatch} data-decision={decision} aria-hidden="true" />
          {intro.decisions[decision]}
        </li>
      ))}
    </ul>
  );
}

/* Glyphs for the four method steps: small, flat, drawn like the app's charts. */

function MethodGlyph({ index }: { index: number }) {
  const glyphs = [
    // Disease proteins: a small module.
    <g key="disease">
      <g className={styles.edges}>
        <line x1={34} y1={22} x2={52} y2={34} />
        <line x1={52} y1={34} x2={40} y2={50} />
        <line x1={34} y1={22} x2={40} y2={50} />
        <line x1={52} y1={34} x2={72} y2={26} />
      </g>
      <circle className={styles.node} data-role="disease" cx={34} cy={22} r={5} />
      <circle className={styles.node} data-role="disease" cx={52} cy={34} r={5} />
      <circle className={styles.node} data-role="disease" cx={40} cy={50} r={5} />
      <circle className={styles.node} data-role="disease" cx={72} cy={26} r={5} />
    </g>,
    // Network ranking: a target, a route, the module.
    <g key="network">
      <g className={styles.edges}>
        <line x1={12} y1={40} x2={32} y2={24} />
        <line x1={32} y1={24} x2={50} y2={44} />
        <line x1={32} y1={24} x2={28} y2={52} />
        <line x1={50} y1={44} x2={72} y2={30} />
        <line x1={72} y1={30} x2={86} y2={48} />
      </g>
      <path className={styles.routeStatic} d="M12 40L32 24L50 44L72 30" />
      <circle className={styles.node} data-role="target" cx={12} cy={40} r={5} />
      <circle className={styles.node} data-role="route" cx={32} cy={24} r={4} />
      <circle className={styles.node} data-role="protein" cx={28} cy={52} r={4} />
      <circle className={styles.node} data-role="route" cx={50} cy={44} r={4} />
      <circle className={styles.node} data-role="disease" cx={72} cy={30} r={5} />
      <circle className={styles.node} data-role="disease" cx={86} cy={48} r={5} />
    </g>,
    // Evidence review: three models, three calls.
    <g key="jury">
      {[0, 1, 2].map((model) => (
        <g key={model} transform={`translate(${String(14 + model * 26)} 14)`}>
          <g className={styles.glyphMarker} transform="translate(5 0)">
            {
              [
                <circle key="c" cx={6} cy={6} r={4.6} />,
                <rect key="s" x={1.6} y={1.6} width={8.8} height={8.8} />,
                <path key="t" d="M6 1.2L10.9 10.2H1.1Z" />,
              ][model]
            }
          </g>
          <rect
            className={styles.glyphTile}
            data-decision={(["investigate", "investigate", "watch"] as const)[model]}
            x={0}
            y={22}
            width={22}
            height={14}
            rx={2}
          />
          <rect
            className={styles.glyphTile}
            data-decision={(["watch", "deprioritise", "deprioritise"] as const)[model]}
            x={0}
            y={40}
            width={22}
            height={14}
            rx={2}
          />
        </g>
      ))}
    </g>,
    // Shortlist: ranked lines.
    <g key="shortlist" className={styles.glyphList}>
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(14 ${String(16 + row * 16)})`}>
          <text x={0} y={4}>
            {row + 1}
          </text>
          <line x1={14} y1={0} x2={78 - row * 14} y2={0} />
        </g>
      ))}
    </g>,
  ];
  return (
    <svg className={styles.glyph} viewBox="0 0 100 66" aria-hidden="true" focusable="false">
      {glyphs[index]}
    </svg>
  );
}

/* 1. Scientific editorial: a large serif headline, two figures between fine rules, and a compact
   method figure underneath. Asymmetric, generous whitespace. */

const METHOD_CROPS = [crops.diseaseProtein, crops.network, crops.review, crops.shortlist];

function Editorial() {
  return (
    <div className={styles.v1}>
      <Backdrop look="corner" />
      <Reveal order={0} className={styles.v1Head}>
        <h1 className={styles.v1Title}>{intro.title}</h1>
        <Sticker className={styles.v1Tag} tone="tape" tilt={-3} animate>
          {intro.tagline}
        </Sticker>
      </Reveal>
      <Reveal order={2} className={styles.v1Plate}>
        <LabPlate centred chapterName={false} />
      </Reveal>
      <Reveal order={1} className={styles.v1Solution}>
        <p className={styles.v1Lede}>{intro.solution}</p>
        <div className={styles.v1Action}>
          <Start />
          <p className={styles.limit}>{intro.limit}</p>
        </div>
      </Reveal>
      <Reveal order={3} className={styles.v1Method}>
        <figure>
          <ol className={styles.v1Steps}>
            {intro.method.map((step, index) => (
              <li key={step.title} className={styles.v1Step}>
                <div className={styles.v1Thumb}>
                  <CropImage crop={METHOD_CROPS[index] ?? crops.network} />
                  <span className={styles.v1Glyph}>
                    <MethodGlyph index={index} />
                  </span>
                </div>
                <h2 className={styles.v1StepTitle}>
                  <span className={styles.v1StepNo}>{index + 1}</span>
                  {step.title}
                </h2>
                <p className={styles.v1StepText}>{step.text}</p>
              </li>
            ))}
          </ol>
        </figure>
      </Reveal>
      <Reveal order={4} className={styles.v1Workflow}>
        <section aria-labelledby="v1-workflow">
          <h2 id="v1-workflow" className={styles.v1WorkflowTitle}>
            Workflow
          </h2>
          <p className={styles.v1WorkflowLede}>Find existing medicines worth investigating.</p>
          <WorkflowMap className={styles.v1WorkflowMap} />
        </section>
      </Reveal>
    </div>
  );
}

/* 2. Network study: headline and figures beside a large, precisely drawn protein network that
   shows how a candidate is prioritised. */

function NetworkStudy() {
  return (
    <div className={styles.v2}>
      <Backdrop look="corner" />
      <div className={styles.v2Text}>
        <Reveal order={0}>
          <h1 className={styles.v2Title}>{intro.title}</h1>
          <p className={styles.v2Lede}>{intro.solution}</p>
        </Reveal>
        <Reveal order={1}>
          <dl className={styles.v2Stats}>
            {intro.problem.map((statistic) => (
              <div key={statistic.value} className={styles.v2Stat}>
                <dt>
                  <Figure statistic={statistic} />
                </dt>
                <dd>
                  {statistic.text} <SourceLink source={statistic.source} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal order={2} className={styles.v2Action}>
          <Start />
          <p className={styles.limit}>{intro.limit}</p>
        </Reveal>
      </div>
      <Reveal order={1} className={styles.v2Figure}>
        <figure>
          <div className={styles.v2Specimen}>
            <CropImage crop={crops.cell} className={styles.v2Cell} />
            <NetworkPlot labels className={styles.v2Network} />
            <Sticker className={styles.v2StickerA} tone="route" tilt={-3} animate>
              Drug A · 2 steps from the disease
            </Sticker>
            <Sticker className={styles.v2StickerB} tone="tape" tilt={2.5} animate>
              {intro.notAnLlm}
            </Sticker>
          </div>
          <figcaption className={styles.v2Caption}>
            <div className={styles.v2Annotations}>
              <ol className={styles.v2Notes}>
                <li>
                  <span className={styles.v2NoteNo}>1</span>
                  <span>
                    <b>Disease proteins</b> are those with evidence linking them to the disease.
                  </span>
                </li>
                <li>
                  <span className={styles.v2NoteNo}>2</span>
                  <span>
                    <b>Drug targets</b> are the proteins each approved drug acts on.
                  </span>
                </li>
                <li>
                  <span className={styles.v2NoteNo}>3</span>
                  <span>
                    <b>Closeness</b>: drugs whose targets sit fewer steps from the disease rank
                    higher.
                  </span>
                </li>
              </ol>
              <div className={styles.v2Rank}>
                <p className={styles.panelTitle}>{intro.rankedBy}</p>
                <Ranking />
              </div>
            </div>
            <div className={styles.v2Foot}>
              <NetworkKey />
              <p className={styles.note}>{intro.schematic}</p>
            </div>
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}

/* 3. Evidence plate: one structured figure, panels a to c, from the problem to the network
   ranking to the three-model evidence review. */

function EvidencePlate() {
  const [years, failure] = intro.problem;
  return (
    <div className={styles.v3}>
      <Backdrop look="wide" />
      <Reveal order={0} className={styles.v3Head}>
        <h1 className={styles.v3Title}>{intro.title}</h1>
        <div className={styles.v3Intro}>
          <p className={styles.v3Lede}>{intro.solution}</p>
          <div className={styles.v3Action}>
            <Start />
            <p className={styles.limit}>{intro.limit}</p>
          </div>
        </div>
      </Reveal>
      <Reveal order={1}>
        <figure className={styles.v3Plate}>
          <div className={styles.v3Panels}>
            <section className={styles.v3Panel} aria-labelledby="plate-a">
              <h2 id="plate-a" className={styles.v3PanelTitle}>
                <span className={styles.v3Letter}>a</span> The problem
              </h2>
              <LabPlate controls={false} className={styles.v3Visual} />
              {years !== undefined && (
                <div className={styles.v3Chart}>
                  <p className={styles.v3Figure}>
                    <Figure statistic={years} />
                  </p>
                  <Timeline />
                  <p className={styles.v3Text}>
                    {years.text} <SourceLink source={years.source} />
                  </p>
                </div>
              )}
              {failure !== undefined && (
                <div className={styles.v3Chart}>
                  <p className={styles.v3Figure}>
                    <Figure statistic={failure} />
                  </p>
                  <Waffle />
                  <p className={styles.v3Text}>
                    {failure.text} <SourceLink source={failure.source} />
                  </p>
                </div>
              )}
            </section>
            <section className={styles.v3Panel} aria-labelledby="plate-b">
              <h2 id="plate-b" className={styles.v3PanelTitle}>
                <span className={styles.v3Letter}>b</span> Network ranking
              </h2>
              <div className={styles.v3VisualWrap}>
                <CropImage crop={crops.network} className={styles.v3Visual} />
                <Sticker className={styles.v3Sticker} tone="ink" tilt={-2}>
                  {intro.notAnLlm}
                </Sticker>
              </div>
              <p className={styles.v3Text}>{intro.method[1]?.text}</p>
              <NetworkPlot className={styles.v3Network} />
              <NetworkKey />
              <Ranking className={styles.v3Ranking} />
            </section>
            <section className={styles.v3Panel} aria-labelledby="plate-c">
              <h2 id="plate-c" className={styles.v3PanelTitle}>
                <span className={styles.v3Letter}>c</span> Evidence review
              </h2>
              <div className={styles.v3VisualWrap}>
                <CropImage crop={crops.review} className={styles.v3Visual} />
                <Sticker className={styles.v3Sticker} tone="tape" tilt={2}>
                  Disagreements stay visible
                </Sticker>
              </div>
              <p className={styles.v3Text}>{intro.method[2]?.text}</p>
              <Ballot className={styles.v3Ballot} />
              <BallotKey />
            </section>
          </div>
          <figcaption className={styles.v3Caption}>
            Panels b and c are illustrative, not real results. Every ranking is a research
            hypothesis to be tested, not a proven treatment.
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}

/** Ten-plus years on a 0 to 15 year axis. */
function Timeline() {
  const x = (year: number) => 2 + (year / 15) * 276;
  return (
    <svg className={styles.v3Svg} viewBox="0 0 280 40" aria-hidden="true" focusable="false">
      <rect className={styles.barFill} x={x(0)} y={6} width={x(10) - x(0)} height={12} />
      <rect className={styles.barMore} x={x(10)} y={6} width={x(13) - x(10)} height={12} />
      <line className={styles.axis} x1={x(0)} y1={24} x2={x(15)} y2={24} />
      {[0, 5, 10, 15].map((year) => (
        <g key={year}>
          <line className={styles.axis} x1={x(year)} y1={24} x2={x(year)} y2={28} />
          <text
            className={styles.tick}
            x={x(year)}
            y={38}
            textAnchor={year === 0 ? "start" : year === 15 ? "end" : "middle"}
          >
            {year === 15 ? "15 years" : year}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** One hundred candidates entering trials: about ninety fail. */
function Waffle() {
  return (
    <svg className={styles.v3Svg} viewBox="0 0 280 40" aria-hidden="true" focusable="false">
      {Array.from({ length: 100 }, (_, i) => (
        <rect
          key={i}
          className={i < 90 ? styles.waffleFail : styles.waffleOther}
          x={2 + (i % 25) * 11.12}
          y={2 + Math.floor(i / 25) * 9.5}
          width={8}
          height={7}
        />
      ))}
    </svg>
  );
}

/* 4. Institutional modern: a centred headline, then a broad band on a pale neutral ground with
   the problem, the method and the output side by side. */

function Institutional() {
  return (
    <div className={styles.v4}>
      <Backdrop look="centre" />
      <Reveal order={0} className={styles.v4Head}>
        <Sticker tone="tape" tilt={-2} animate>
          {intro.tagline}
        </Sticker>
        <h1 className={styles.v4Title}>{intro.title}</h1>
        <p className={styles.v4Lede}>{intro.solution}</p>
        <Start className={styles.v4Start} />
        <p className={styles.limit}>{intro.limit}</p>
      </Reveal>
      <Reveal order={1} className={styles.v4Lab}>
        <LabPlate caption={<span className={styles.v4LabCaption}>{intro.clues}</span>} />
      </Reveal>
      <Reveal order={2} className={styles.v4Band}>
        <div className={styles.v4Columns}>
          <section className={styles.v4Column} aria-labelledby="band-problem">
            <h2 id="band-problem" className={styles.v4Label}>
              The problem
            </h2>
            <CropImage crop={crops.diseaseProtein} className={styles.v4Crop} />
            <dl className={styles.v4Stats}>
              {intro.problem.map((statistic) => (
                <div key={statistic.value}>
                  <dt>
                    <Figure statistic={statistic} />
                  </dt>
                  <dd>
                    {statistic.text} <SourceLink source={statistic.source} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={styles.v4Column} aria-labelledby="band-method">
            <h2 id="band-method" className={styles.v4Label}>
              The method
            </h2>
            <CropImage crop={crops.network} className={styles.v4Crop} />
            <ol className={styles.v4Method}>
              {intro.method.slice(0, 3).map((step, index) => (
                <li key={step.title}>
                  <span className={styles.v4MethodNo}>{index + 1}</span>
                  <span>
                    <b>{step.title}</b>
                    <span className={styles.v4MethodText}>{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section className={styles.v4Column} aria-labelledby="band-output">
            <h2 id="band-output" className={styles.v4Label}>
              The output
            </h2>
            <CropImage crop={crops.shortlist} className={styles.v4Crop} />
            <p className={styles.v4OutputText}>{intro.method[3]?.text}</p>
            <Ballot className={styles.v4Ballot} />
            <BallotKey />
            <p className={styles.note}>{intro.example}</p>
          </section>
        </div>
      </Reveal>
      <Reveal order={3} className={styles.v4Sources}>
        <p className={styles.v4SourcesLabel}>Built on</p>
        <SourceMarquee names={intro.builtOn} />
      </Reveal>
    </div>
  );
}
