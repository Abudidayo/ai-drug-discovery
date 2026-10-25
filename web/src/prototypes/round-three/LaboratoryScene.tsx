import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { MonitorStory } from "./MonitorStory";
import background from "./assets/lab/laboratory.webp";
import researcher from "./assets/lab/researcher.webp";
import microscope from "./assets/lab/microscope.webp";
import "./laboratory.css";

// Both images use the generated character's native coordinate space. The masks
// separate the raised forearm at its cuff so the illustration can articulate.
const armOutline =
  "410,274 496,255 549,363 578,447 615,521 730,746 675,766 604,655 514,592 458,623 397,593 392,533 419,448 414,359";

export function LaboratoryScene({
  chapter,
  playing = true,
  reduced = false,
  instant = true,
  manual = false,
  revision = 0,
  fullViewport = false,
}: {
  chapter?: number;
  playing?: boolean;
  reduced?: boolean;
  instant?: boolean;
  manual?: boolean;
  revision?: number;
  fullViewport?: boolean;
}) {
  const camera = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const projection = useRef<HTMLDivElement>(null);
  const transition = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const host = viewport.current;
    const plane = projection.current;
    if (!host || !plane) return;
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      const scale = (fullViewport ? Math.max : Math.min)(width / 1672, height / 941);
      const x = (width - 1672 * scale) / 2;
      const y = (height - 941 * scale) / 2;
      plane.style.transform = `translate3d(${String(x)}px, ${String(y)}px, 0) scale(${String(scale)})`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => {
      observer.disconnect();
    };
  }, [fullViewport]);
  useLayoutEffect(() => {
    const node = camera.current;
    const host = viewport.current;
    if (!node || chapter === undefined) return;
    const destination =
      chapter === 0
        ? "translate3d(0px, 0px, 0) scale(1)"
        : fullViewport
          ? chapter === 3
            ? "translate3d(-750px, -40px, 0) scale(1.4)"
            : chapter === 2
              ? "translate3d(-1570px, -150px, 0) scale(1.9)"
              : "translate3d(-1360px, -82px, 0) scale(1.75)"
          : chapter === 3
            ? "translate3d(-1420px, -100px, 0) scale(1.8)"
            : "translate3d(-2890px, -313px, 0) scale(2.7)";
    const from = getComputedStyle(node).transform;
    node.style.transform = destination;
    const currentMatrix = new DOMMatrix(from);
    const destinationMatrix = new DOMMatrix(destination);
    const sameFrame = (["a", "b", "c", "d", "e", "f"] as const).every(
      (key) => Math.abs(currentMatrix[key] - destinationMatrix[key]) < 0.0001,
    );
    if (reduced || instant || sameFrame) return;
    const animation = node.animate([{ transform: from }, { transform: destination }], {
      duration: manual ? 900 : 1600,
      easing: manual ? "cubic-bezier(0.23, 1, 0.32, 1)" : "cubic-bezier(0.77, 0, 0.175, 1)",
    });
    transition.current = animation;
    // Cache the illustrated frame while the camera travels; resume details on arrival.
    host?.setAttribute("data-camera-moving", "true");
    const settle = () => {
      if (transition.current !== animation) return;
      transition.current = null;
      host?.removeAttribute("data-camera-moving");
    };
    void animation.finished.then(settle, settle);
    return () => {
      // Retarget from the visible frame when another chapter interrupts this move.
      node.style.transform = getComputedStyle(node).transform;
      animation.cancel();
      host?.removeAttribute("data-camera-moving");
      if (transition.current === animation) transition.current = null;
    };
  }, [chapter, reduced, instant, manual, revision, fullViewport]);
  useEffect(() => {
    if (playing) transition.current?.play();
    else transition.current?.pause();
  }, [playing, chapter, revision]);
  const id = useId().replaceAll(":", "");
  const bodyMask = `${id}-body`;
  const armClip = `${id}-arm`;
  return (
    <div className="researcher-image animated-lab" ref={viewport}>
      <div className="lab-projection" ref={projection}>
        <div className="lab-camera-world" ref={camera}>
          <svg
            className="laboratory-scene"
            viewBox="0 0 1672 941"
            preserveAspectRatio={fullViewport ? "xMidYMid slice" : "xMidYMid meet"}
            role="img"
            aria-label="Original faceted laboratory illustration: a scientist pipettes a sample beside a microscope while a protein network display lights up."
          >
            <defs>
              <mask id={bodyMask} maskUnits="userSpaceOnUse" x="0" y="0" width="1637" height="961">
                <rect width="1637" height="961" fill="white" />
                <polygon points={armOutline} fill="black" />
              </mask>
              <clipPath id={armClip}>
                <polygon points={armOutline} />
              </clipPath>
            </defs>
            <g className="lab-art-world">
              <image href={background} width="1672" height="941" />
              <g className="lab-display" aria-hidden="true">
                <path
                  d="M1180 470h130l42-27 25 12 40-53 32 26 45-8 45 17"
                  fill="none"
                  stroke="#69dfeb"
                  strokeWidth="3"
                  opacity=".65"
                />
                <circle
                  className="lab-monitor-signal"
                  data-motion-target
                  cx="1308"
                  cy="470"
                  r="7"
                  fill="#9cf4ff"
                />
                <circle
                  className="lab-protein-signal"
                  data-motion-target
                  cx="1495"
                  cy="150"
                  r="12"
                  fill="#9cf4ff"
                />
              </g>
              <svg
                x="42"
                y="34"
                width="1473"
                height="865"
                viewBox="0 0 1637 961"
                overflow="visible"
              >
                {/* A coat underlap prevents a gap as the separate pipetting arm moves. */}
                <path d="M500 525h110l140 255H590L470 620Z" fill="#98aaea" />
                <path d="m550 550 142 150-102 80-75-160Z" fill="#879de4" />
                <image href={researcher} width="1637" height="961" mask={`url(#${bodyMask})`} />
                <g className="lab-pipetting-arm" data-motion-target>
                  <image
                    href={researcher}
                    width="1637"
                    height="961"
                    clipPath={`url(#${armClip})`}
                  />
                </g>
              </svg>
              <g className="lab-sample" aria-hidden="true">
                <ellipse cx="688" cy="851" rx="62" ry="17" fill="#73bed5" opacity=".7" />
                <path d="M626 845v12c0 22 124 22 124 0v-12" fill="#b4dded" opacity=".8" />
                <ellipse cx="688" cy="844" rx="62" ry="16" fill="#d4f3fb" opacity=".8" />
                <ellipse
                  className="lab-sample-ripple"
                  data-motion-target
                  cx="688"
                  cy="844"
                  rx="25"
                  ry="7"
                  fill="none"
                  stroke="#389bbe"
                  strokeWidth="3"
                />
                <g className="lab-sample-drop" data-motion-target>
                  <path
                    d="M680 701c-14 20-17 25-17 32a17 17 0 0 0 34 0c0-7-3-12-17-32Z"
                    fill="#9cecf5"
                  />
                </g>
              </g>
              <image
                className="lab-microscope"
                href={microscope}
                x="823"
                y="399"
                width="350"
                height="525"
              />
              <g className="lab-focus-light" data-motion-target aria-hidden="true">
                <ellipse cx="997" cy="683" rx="38" ry="7" fill="#b0f4ff" opacity=".7" />
              </g>
              {chapter !== undefined && <MonitorStory chapter={chapter} />}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
