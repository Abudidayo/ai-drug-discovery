import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import completeWorkflow from "./assets/complete-workflow.svg";
import { usePlayback } from "./playback";
import workflowMap from "./workflow-map.json";
import styles from "./workflowMap.module.css";
import { WorkflowVisual } from "./WorkflowVisual";

/*
 * The workflow at a glance (after Jessica's TechnicalOverview): seven nodes on a 1280 x 520 map,
 * with three signals that travel each route in turn and light the node they leave or reach. The
 * complete engineering diagram and its notes sit behind "Technical details".
 */

const { nodes, routes } = workflowMap;

const WIDTH = 1280;
const HEIGHT = 520;
const PHASES = routes.length;
const PHASE_DURATION = 4600;
const DURATION = PHASES * PHASE_DURATION;
/** When, within a phase, the signal leaves and reaches its node. */
const DEPART = 2400;
const TRAVEL = 1500;
const ARRIVE = 3900;
const SAMPLES = 40;

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

function Glyph({ name }: { name: "play" | "pause" | "replay" | "chevron" }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true">
      {name === "play" && <path d="M5 3.5v9l7-4.5Z" />}
      {name === "pause" && <path d="M5.5 3.5v9M10.5 3.5v9" />}
      {name === "replay" && <path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2M3.5 2.5v2.8h2.8" />}
      {name === "chevron" && <path d="m4.5 6 3.5 3.5L11.5 6" />}
    </svg>
  );
}

/** Keyframes that carry a signal along every route in turn, resting between phases. */
function signalFrames(paths: readonly (SVGPathElement | null)[]): Keyframe[] {
  const frames: Keyframe[] = [];
  paths.forEach((path, index) => {
    if (!path) return;
    const length = path.getTotalLength();
    const start = index * PHASE_DURATION;
    const frame = (fraction: number, time: number, opacity: number) => {
      const point = path.getPointAtLength(length * fraction);
      frames.push({
        offset: time / DURATION,
        transform: `translate3d(${String(point.x)}px, ${String(point.y)}px, 0)`,
        opacity,
      });
    };
    frame(0, start, 0);
    frame(0, start + DEPART - 200, 0);
    frame(0, start + DEPART, 1);
    for (let sample = 1; sample <= SAMPLES; sample++) {
      frame(sample / SAMPLES, start + DEPART + (sample / SAMPLES) * TRAVEL, 1);
    }
    frame(1, start + ARRIVE + 350, 0);
    frame(1, start + PHASE_DURATION, 0);
  });
  return frames;
}

export function WorkflowMap({ className }: { className?: string | undefined }) {
  const playback = usePlayback();
  const [revision, setRevision] = useState(0);
  const [phase, setPhase] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const signals = useRef<(HTMLSpanElement | null)[]>([]);
  const animations = useRef<Animation[]>([]);
  const id = useId().replaceAll(":", "");
  const arrow = `workflow-arrow-${id}`;
  const detailsId = `workflow-details-${id}`;
  const route = routes[phase];
  const active = arrived ? route?.to : route?.from;

  // The signals move in map coordinates; scale their plane to the drawn map.
  useLayoutEffect(() => {
    const host = canvas.current;
    const world = plane.current;
    if (!host || !world) return;
    const resize = () => {
      world.style.transform = `scale(${String(host.clientWidth / WIDTH)})`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => {
      observer.disconnect();
    };
  }, [playback.reduced]);

  useEffect(() => {
    if (playback.reduced) return;
    const frames = signalFrames(paths.current);
    animations.current = signals.current.flatMap((signal, index) => {
      if (!signal) return [];
      const animation = signal.animate(frames, {
        duration: DURATION,
        iterations: Infinity,
        delay: index * 180,
        fill: "both",
      });
      animation.pause();
      return [animation];
    });
    const timer = window.setInterval(() => {
      const time = Number(animations.current[0]?.currentTime ?? 0) % DURATION;
      setPhase(Math.floor(time / PHASE_DURATION));
      setArrived(time % PHASE_DURATION >= ARRIVE);
    }, 160);
    return () => {
      window.clearInterval(timer);
      animations.current.forEach((animation) => {
        animation.cancel();
      });
      animations.current = [];
    };
  }, [revision, playback.reduced]);

  useEffect(() => {
    animations.current.forEach((animation) => {
      if (playback.playing) {
        animation.play();
      } else {
        animation.pause();
      }
    });
  }, [playback.playing, playback.reduced, revision]);

  const replay = () => {
    setPhase(0);
    setArrived(false);
    setRevision((value) => value + 1);
    if (!playback.playing) playback.toggle();
  };

  return (
    <section
      className={cx(styles.root, className)}
      aria-label="Half Life workflow"
      data-playing={playback.playing}
      data-reduced={playback.reduced}
    >
      <div className={styles.scroller}>
        <div
          className={styles.canvas}
          ref={canvas}
          role="group"
          aria-label="Half Life technical workflow"
        >
          <svg
            className={styles.routes}
            viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id={arrow}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path className={styles.arrowhead} d="m1 1 8 4-8 4" />
              </marker>
            </defs>
            {routes.map((edge, index) => (
              <path
                key={`${edge.from}-${edge.to}`}
                d={edge.d}
                className={styles.route}
                data-dashed={edge.dashed === true}
                markerEnd={`url(#${arrow})`}
                ref={(node) => {
                  paths.current[index] = node;
                }}
              />
            ))}
          </svg>
          <div className={styles.nodes}>
            {nodes.map((node) => (
              <article
                key={node.id}
                className={styles.node}
                data-node={node.id}
                data-active={!playback.reduced && active === node.id}
                style={{
                  left: `${String((node.x / WIDTH) * 100)}%`,
                  top: `${String((node.y / HEIGHT) * 100)}%`,
                  width: `${String((node.w / WIDTH) * 100)}%`,
                  height: `${String((node.h / HEIGHT) * 100)}%`,
                }}
              >
                <h3 className={styles.title}>{node.title}</h3>
                <p className={styles.keyPoint}>{node.keyPoint}</p>
                <WorkflowVisual key={`${node.id}-${String(revision)}`} kind={node.id} />
                <p className={styles.copy}>
                  {node.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </article>
            ))}
          </div>
          {!playback.reduced && (
            <div className={styles.plane} ref={plane} aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <span
                  className={styles.signal}
                  key={index}
                  ref={(node) => {
                    signals.current[index] = node;
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.controls} role="group" aria-label="Workflow animation">
        <button type="button" disabled={playback.reduced} onClick={playback.toggle}>
          <Glyph name={playback.playing ? "pause" : "play"} />
          {playback.reduced ? "Reduced motion" : playback.playing ? "Pause" : "Play"}
        </button>
        <button type="button" disabled={playback.reduced} onClick={replay}>
          <Glyph name="replay" />
          Replay
        </button>
        <button
          type="button"
          className={styles.detailsToggle}
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => {
            setDetailsOpen((value) => !value);
          }}
        >
          Technical details
          <Glyph name="chevron" />
        </button>
      </div>
      <div id={detailsId} className={styles.details} hidden={!detailsOpen}>
        <div className={styles.diagram}>
          <img
            src={completeWorkflow}
            alt="Open Targets, ChEMBL, STRING and Reactome connect drugs to disease biology. Physical-network RWR and direct evidence select up to 15 candidates. Source statements and E-IDs feed independent openai-gpt-5.4, glm-5.3 and kimi-k3 reviews through Snowflake Cortex. Schema, citation and numeric checks produce critiques and Borda consensus. TigerData PostgreSQL preserves experiments, evidence and votes. Optional RCSB PDB, Docker, RDKit, Meeko and AutoDock Vina support predicted pose inspection."
          />
        </div>
        <div className={styles.notes}>
          <p>
            <strong>Network relevance.</strong> Default RWR: p(next) = 0.7 Pᵀp + 0.3 p₀. Drug score
            is mean stationary mass at mapped targets. Missing coverage stays explicit.
          </p>
          <p>
            <strong>Traceable review.</strong> Stored statements and exact model wording stay
            inspectable. At least two valid jurors are required; objections and disagreements remain
            visible.
          </p>
          <p>
            <strong>Research outputs.</strong> Associations and predicted poses need further
            testing. Large graph and pose files remain in file storage; TigerData retains their
            references and hashes.
          </p>
        </div>
      </div>
    </section>
  );
}
