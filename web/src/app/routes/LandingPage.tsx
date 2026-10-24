import { Shell } from "../Shell";
import { StepPlaceholder } from "../StepPlaceholder";

/** `/`: step 1, choosing a Disease, before any Experiment exists. */
export function LandingPage() {
  return (
    <Shell step="disease">
      <StepPlaceholder step="disease" />
    </Shell>
  );
}
