import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useIllustrationPlayback } from "../hooks";
import { Icon } from "./components";
import { technicalOverviewImage } from "./workflow-content";
import simpleMap from "./workflow-simple-map.json";
import { WorkflowVisual } from "./WorkflowVisual";
const { nodes, routes } = simpleMap;

// Keep the overview readable; the complete engineering map stays available below.
const phases = [0, 1, 2, 3, 4, 5, 6] as const;
const phaseDuration = 4600;
const duration = phases.length * phaseDuration;

export function TechnicalOverview() {
  const playback = useIllustrationPlayback();
  const [revision, setRevision] = useState(0);
  const [phase, setPhase] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const map = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const particles = useRef<(HTMLSpanElement | null)[]>([]);
  const animations = useRef<Animation[]>([]);
  const current = phases[phase] ?? phases[0];
  const arrow = `simple-arrow-${useId().replaceAll(":", "")}`;
  const active = arrived ? routes[current]?.to : routes[current]?.from;

  useLayoutEffect(() => {
    const host = map.current;
    const world = plane.current;
    if (!host || !world) return;
    const resize = () => {
      world.style.transform = `scale(${String(host.clientWidth / 1280)})`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (playback.reduced) return;
    const frames: Keyframe[] = [];
    phases.forEach((edge, index) => {
      const path = paths.current[edge];
      if (!path) return;
      const length = path.getTotalLength();
      const start = index * phaseDuration;
      const pointFrame = (fraction: number, time: number, opacity: number) => {
        const point = path.getPointAtLength(length * fraction);
        frames.push({
          offset: time / duration,
          transform: `translate3d(${String(point.x)}px,${String(point.y)}px,0)`,
          opacity,
        });
      };
      pointFrame(0, start, 0);
      pointFrame(0, start + 2200, 0);
      pointFrame(0, start + 2400, 1);
      for (let sample = 1; sample <= 40; sample++)
        pointFrame(sample / 40, start + 2400 + (sample / 40) * 1500, 1);
      pointFrame(1, start + 4250, 0);
      pointFrame(1, start + phaseDuration, 0);
    });
    animations.current = particles.current.flatMap((particle, index) => {
      if (!particle) return [];
      const animation = particle.animate(frames, {
        duration,
        iterations: Infinity,
        delay: index * 180,
        fill: "both",
      });
      animation.pause();
      return [animation];
    });
    const timer = window.setInterval(() => {
      const time = Number(animations.current[0]?.currentTime ?? 0) % duration;
      setPhase(Math.floor(time / phaseDuration));
      setArrived(time % phaseDuration >= 3900);
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
      if (playback.playing) animation.play();
      else animation.pause();
    });
  }, [playback.playing, playback.reduced, revision]);

  return (
    <section
      className="technical-overview"
      aria-labelledby="technical-title"
      data-playing={playback.playing}
      data-reduced={playback.reduced}
    >
      <div className="technical-heading">
        <h1 id="technical-title">Workflow</h1>
        <p>Find existing medicines worth investigating.</p>
      </div>
      <div className="overview-map">
        <div
          id="workflow-map"
          className="overview-canvas"
          ref={map}
          role="group"
          aria-label="Half Life technical workflow"
        >
          <svg className="simple-workflow-diagram" viewBox="0 0 1280 520" aria-hidden="true">
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
                <path d="m1 1 8 4-8 4" fill="none" stroke="#9ebfd1" strokeWidth="1.5" />
              </marker>
            </defs>
            {routes.map((route, index) => (
              <path
                key={index}
                d={route.d}
                className="simple-route"
                strokeDasharray={route.dashed ? "4 6" : undefined}
                markerEnd={`url(#${arrow})`}
                ref={(node) => {
                  paths.current[index] = node;
                }}
              />
            ))}
          </svg>
          <div className="diagram-nodes">
            {nodes.map((node) => (
              <article
                key={node.id}
                className="simple-node"
                data-node={node.id}
                data-active={!playback.reduced && active === node.id}
                style={{
                  left: `${String((node.x / 1280) * 100)}%`,
                  top: `${String((node.y / 520) * 100)}%`,
                  width: `${String((node.w / 1280) * 100)}%`,
                  height: `${String((node.h / 520) * 100)}%`,
                }}
              >
                <h2 className="simple-node-title">{node.title}</h2>
                <p className="simple-node-keypoint">{node.keyPoint}</p>
                <WorkflowVisual key={`${node.id}-${String(revision)}`} kind={node.id} />
                <p className="simple-node-copy">
                  {node.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </article>
            ))}
          </div>
          <div className="signal-plane" ref={plane} aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span
                className="evidence-signal"
                key={index}
                ref={(node) => {
                  particles.current[index] = node;
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="workflow-tools">
        <div className="walkthrough-controls" role="group" aria-label="Workflow animation">
          <button type="button" disabled={playback.reduced} onClick={playback.toggle}>
            <Icon name={playback.playing ? "pause" : "play"} />
            {playback.reduced ? "Reduced motion" : playback.playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            disabled={playback.reduced}
            onClick={() => {
              setPhase(0);
              setArrived(false);
              setRevision((value) => value + 1);
              if (!playback.playing) playback.toggle();
            }}
          >
            <Icon name="replay" />
            Replay
          </button>
          <button
            type="button"
            className="technical-toggle"
            aria-expanded={technicalOpen}
            aria-controls="technical-spec-content"
            onClick={() => {
              setTechnicalOpen((value) => !value);
            }}
          >
            Technical details <Icon name="arrow" />
          </button>
        </div>
      </div>
      <div id="technical-spec-content" className="technical-spec" hidden={!technicalOpen}>
        <div className="technical-spec-content">
          <img
            id="technical-diagram"
            className="complete-workflow-diagram"
            src={technicalOverviewImage}
            alt="Open Targets, ChEMBL, STRING and Reactome connect drugs to disease biology. Physical-network RWR and direct evidence select up to 15 candidates. Source statements and E-IDs feed independent openai-gpt-5.4, glm-5.3 and kimi-k3 reviews through Snowflake Cortex. Schema, citation and numeric checks produce critiques and Borda consensus. TigerData PostgreSQL preserves experiments, evidence and votes. Optional RCSB PDB, Docker, RDKit, Meeko and AutoDock Vina support predicted pose inspection."
          />
          <div className="overview-notes">
            <p>
              <strong>Network relevance.</strong> Default RWR: p(next) = 0.7 Pᵀp + 0.3 p₀. Drug
              score is mean stationary mass at mapped targets. Missing coverage stays explicit.
            </p>
            <p>
              <strong>Traceable review.</strong> Stored statements and exact model wording stay
              inspectable. At least two valid jurors are required; objections and disagreements
              remain visible.
            </p>
            <p>
              <strong>Research outputs.</strong> Associations and predicted poses need further
              testing. Large graph and pose files remain in file storage; TigerData retains their
              references and hashes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
