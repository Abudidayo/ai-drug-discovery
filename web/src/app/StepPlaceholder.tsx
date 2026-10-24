import { copy, type StepSlug } from "../copy/en";
import styles from "./StepPlaceholder.module.css";
import { stepPhase } from "./steps";

/** Stands in for a step's figure until its phase of the plan builds it. */
export function StepPlaceholder({ step }: { step: StepSlug }) {
  return (
    <div className={styles.placeholder}>
      <p>{copy.pending(stepPhase[step])}</p>
    </div>
  );
}
