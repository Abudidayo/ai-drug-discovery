import { useParams } from "react-router";
import { isStepSlug } from "../../copy/en";
import { Shell } from "../Shell";
import { StepPlaceholder } from "../StepPlaceholder";
import { NotFoundPage } from "./NotFoundPage";

/** `/e/:experimentId/:step`: one step of a saved Experiment. */
export function StepPage() {
  const { experimentId, step } = useParams();
  if (experimentId === undefined || !isStepSlug(step)) return <NotFoundPage />;

  // Phase 3b loads the Experiment from the API here and passes its Disease to the shell.
  return (
    <Shell step={step} experimentId={experimentId}>
      <StepPlaceholder key={step} step={step} />
    </Shell>
  );
}
