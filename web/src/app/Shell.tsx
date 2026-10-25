import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { copy, stepCopy, type StepSlug } from "../copy/en";
import {
  FOLLOW_UP_STEPS,
  isFollowUpStep,
  type FollowUps,
  type FollowUpState,
} from "../lib/followUps";
import { PageBody, PageFrame } from "./PageFrame";
import styles from "./Shell.module.css";
import { neighbourStep, stepPath } from "./steps";
import { useStepKeys } from "./useStepKeys";

interface ShellProps {
  step: StepSlug;
  /** Absent on the landing page, before a Disease has been chosen. */
  experimentId?: string | undefined;
  /** The Experiment's Disease, shown once in the header. */
  disease?: string | undefined;
  /** Where the work prepared in the background stands; absent until the Experiment loads. */
  followUps?: FollowUps | undefined;
  /** The step's figure. */
  children: ReactNode;
}

/**
 * The app shell: product, Disease and step navigation in the header; then the step title, its
 * intro and the figure; then Back and Next at the bottom right, where a reader finishes the step.
 * The step's name is said once, as the page title; the navigation marks the current step by
 * state (underline and aria-current) and the buttons never repeat a step name. The steps whose
 * result is prepared in the background carry a mark for where it stands, in the same language
 * as the build's progress: a quiet ring, a turning ring while it works, filled once ready.
 */
export function Shell({ step, experimentId, disease, followUps, children }: ShellProps) {
  const navigate = useNavigate();
  const descriptionId = useId();
  const readyNotice = useReadyNotice(followUps, step);
  const { title, intro } = stepCopy(step);

  const previousStep = neighbourStep(step, -1);
  const nextStep = neighbourStep(step, 1);
  const previousPath = previousStep && stepPath(experimentId, previousStep);
  const nextPath = nextStep && stepPath(experimentId, nextStep);

  const goPrevious = useCallback(() => {
    if (previousPath !== undefined) void navigate(previousPath);
  }, [navigate, previousPath]);
  const goNext = useCallback(() => {
    if (nextPath !== undefined) void navigate(nextPath);
  }, [navigate, nextPath]);
  useStepKeys(goPrevious, goNext);

  // On narrow screens the steps scroll sideways; keep the current one in view.
  const currentLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const link = currentLink.current;
    const nav = link?.closest("nav");
    if (!link || !nav || nav.scrollWidth <= nav.clientWidth) return;
    const linkBox = link.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    nav.scrollLeft += linkBox.left + linkBox.width / 2 - (navBox.left + navBox.width / 2);
  }, [step]);

  return (
    <PageFrame
      header={
        <>
          {disease !== undefined && (
            <span className={styles.disease} title={disease}>
              <span className={styles.diseaseMark} aria-hidden="true" />
              <span className={styles.diseaseName}>{disease}</span>
            </span>
          )}
          <nav className={styles.nav} aria-label={copy.stepsLabel}>
            <ol className={styles.navList}>
              {copy.steps.map((item) => {
                const path = stepPath(experimentId, item.slug);
                // Every follow-up step always has its mark, so a change of state never moves
                // the header.
                const followUp = isFollowUpStep(item.slug)
                  ? (followUps?.[item.slug] ?? "idle")
                  : undefined;
                const description = followUp === undefined ? undefined : describe(followUp);
                const describedBy =
                  description === undefined ? undefined : `${descriptionId}-${item.slug}`;
                const label = (
                  <>
                    {followUp !== undefined && (
                      <span className={styles.mark} data-state={followUp} aria-hidden="true" />
                    )}
                    {item.title}
                  </>
                );
                return (
                  <li key={item.slug} className={styles.navItem}>
                    {path === undefined ? (
                      <span className={styles.navLink} aria-disabled="true">
                        {label}
                      </span>
                    ) : (
                      <Link
                        to={path}
                        className={styles.navLink}
                        ref={item.slug === step ? currentLink : undefined}
                        aria-current={item.slug === step ? "step" : undefined}
                        aria-describedby={describedBy}
                      >
                        {label}
                      </Link>
                    )}
                    {describedBy !== undefined && (
                      <span id={describedBy} hidden>
                        {description}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {/* A polite live region without the status role, which belongs to each step's figure. */}
            <p className={styles.notice} aria-live="polite">
              {readyNotice}
            </p>
          </nav>
        </>
      }
      footer={
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            onClick={goPrevious}
            disabled={previousPath === undefined}
          >
            {copy.back}
          </button>
          <button
            type="button"
            className={`${styles.button ?? ""} ${styles.primary ?? ""}`}
            onClick={goNext}
            disabled={nextPath === undefined}
          >
            {copy.next}
          </button>
        </div>
      }
    >
      <PageBody title={title} intro={intro}>
        {children}
      </PageBody>
    </PageFrame>
  );
}

function describe(state: FollowUpState): string | undefined {
  if (state === "working") return copy.followUp.working;
  if (state === "ready") return copy.followUp.ready;
  return undefined;
}

/**
 * What a screen reader hears when a follow-up becomes ready while the reader is on another step:
 * the mark changes in silence, so this says it once. Nothing is said for the step being read,
 * which shows its own progress, or for what was already ready when the Experiment loaded.
 */
function useReadyNotice(followUps: FollowUps | undefined, step: StepSlug): string {
  const [previous, setPrevious] = useState(followUps);
  const [notice, setNotice] = useState("");
  const changed = FOLLOW_UP_STEPS.some((slug) => followUps?.[slug] !== previous?.[slug]);
  if (changed) {
    setPrevious(followUps);
    const ready = FOLLOW_UP_STEPS.filter(
      (slug) => slug !== step && previous?.[slug] === "working" && followUps?.[slug] === "ready",
    );
    if (ready.length > 0) {
      setNotice(ready.map((slug) => copy.followUp.readyNotice(stepCopy(slug).title)).join(". "));
    }
  }
  return notice;
}
