import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { labChapters, type StoryCrop } from "./content";
import { LaboratoryScene } from "./LaboratoryScene";
import { useChapters, type Chapters } from "./playback";
import styles from "./showpieces.module.css";

/*
 * The introduction's showpieces: Jessica's animated lab as a framed plate, details of her story
 * illustrations, tape stickers, and the soft colour behind it all. Each sits inside the app's own
 * white, black-ink layout rather than replacing it.
 */

function cx(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

const LAB_DURATIONS = labChapters.map((chapter) => chapter.duration);

/**
 * The lab, framed like a figure plate. It plays Jessica's four chapters on a loop: the bench,
 * then the camera moves into the monitor for the years, the compounds and the question. The
 * plate leans gently towards the pointer.
 */
export function LabPlate({
  className,
  caption,
  controls = true,
  chapterName = true,
  centred = false,
}: {
  className?: string | undefined;
  caption?: ReactNode;
  controls?: boolean;
  /** Name the current chapter beside its buttons. */
  chapterName?: boolean;
  /** Centre the chapter buttons under the plate. */
  centred?: boolean;
}) {
  const chapters = useChapters(LAB_DURATIONS, { loop: true });
  const frame = useRef<HTMLDivElement>(null);
  const note = labChapters[chapters.index]?.note;

  function lean(event: PointerEvent<HTMLDivElement>) {
    const node = frame.current;
    if (!node || chapters.reduced || event.pointerType !== "mouse") return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.setProperty("--lean-x", `${(y * -5).toFixed(2)}deg`);
    node.style.setProperty("--lean-y", `${(x * 7).toFixed(2)}deg`);
    node.style.setProperty("--shine-x", `${String(Math.round((x + 0.5) * 100))}%`);
    node.style.setProperty("--shine-y", `${String(Math.round((y + 0.5) * 100))}%`);
  }

  function rest() {
    const node = frame.current;
    if (!node) return;
    node.style.removeProperty("--lean-x");
    node.style.removeProperty("--lean-y");
  }

  return (
    <figure className={cx(styles.labPlate, className)} data-centred={centred}>
      <div className={styles.stage} onPointerMove={lean} onPointerLeave={rest}>
        <div className={styles.labFrame} ref={frame}>
          <LaboratoryScene
            key={chapters.revision}
            chapter={chapters.index}
            playing={chapters.playing}
            reduced={chapters.reduced}
            camera={chapters.camera}
            revision={chapters.revision}
          />
          <div className={styles.shine} aria-hidden="true" />
          {note !== undefined && (
            <Sticker key={chapters.index} className={styles.labNote} tilt={-2.5} animate>
              {note}
            </Sticker>
          )}
        </div>
      </div>
      {(controls || caption !== undefined) && (
        <figcaption className={styles.labCaption}>
          {controls && <ChapterDots chapters={chapters} named={chapterName} />}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Jessica's numbered chapter buttons, drawn in the app's ink; the current one fills as it plays. */
function ChapterDots({ chapters, named }: { chapters: Chapters; named: boolean }) {
  return (
    <div className={styles.dots} role="group" aria-label="The lab's chapters">
      {labChapters.map((chapter, index) => {
        const current = chapters.index === index;
        return (
          <button
            type="button"
            key={chapter.short}
            aria-pressed={current}
            aria-label={chapter.short}
            title={chapter.short}
            onClick={(event) => {
              chapters.select(index, event.detail === 0);
            }}
          >
            {current && (
              <svg
                viewBox="0 0 30 30"
                aria-hidden="true"
                key={`${String(index)}-${String(chapters.revision)}`}
                data-playing={chapters.playing}
                style={{ "--chapter-duration": `${String(chapter.duration)}ms` } as CSSProperties}
              >
                <circle cx="15" cy="15" r="14" pathLength="1" />
              </svg>
            )}
            {index + 1}
          </button>
        );
      })}
      {named && (
        <span className={styles.dotsLabel} aria-live="polite">
          {labChapters[chapters.index]?.short}
        </span>
      )}
    </div>
  );
}

/** A detail of one of Jessica's illustrations, drifting slowly like a documentary still. */
export function CropImage({
  crop,
  className,
}: {
  crop: StoryCrop;
  className?: string | undefined;
}) {
  return (
    <div className={cx(styles.crop, className)} role="img" aria-label={crop.alt}>
      <div
        className={styles.cropArt}
        style={{
          backgroundImage: `url(${crop.image})`,
          backgroundSize: `${String(crop.zoom)}% auto`,
          backgroundPosition: `${String(crop.x)}% ${String(crop.y)}%`,
        }}
      />
    </div>
  );
}

export type StickerTone = "tape" | "disease" | "drug" | "route" | "ink";

/** A label taped onto the page, like the ones drawn into Jessica's shortlist scene. */
export function Sticker({
  children,
  tone = "tape",
  tilt = 0,
  animate = false,
  className,
  style,
}: {
  children: ReactNode;
  tone?: StickerTone;
  tilt?: number;
  animate?: boolean;
  className?: string | undefined;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cx(styles.sticker, className)}
      data-tone={tone}
      data-animate={animate}
      style={{ ...style, "--tilt": `${String(tilt)}deg` } as CSSProperties}
    >
      {children}
    </span>
  );
}

/** Soft blooms of the three role colours and a fading dot grid, behind a section. */
export function Backdrop({ look }: { look: "corner" | "centre" | "wide" }) {
  return (
    <div className={styles.backdrop} data-look={look} aria-hidden="true">
      <span className={styles.bloom} data-role="disease" />
      <span className={styles.bloom} data-role="drug" />
      <span className={styles.bloom} data-role="route" />
      <span className={styles.grid} />
    </div>
  );
}

/** The public data and services the work stands on, gliding past on a loop. */
export function SourceMarquee({ names }: { names: readonly string[] }) {
  const row = (hidden: boolean) => (
    <ul className={styles.marqueeRow} aria-hidden={hidden || undefined}>
      {names.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
  return (
    <div className={styles.marquee}>
      {row(false)}
      {row(true)}
    </div>
  );
}
