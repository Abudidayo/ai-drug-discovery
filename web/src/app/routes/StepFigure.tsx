import { useOutletContext, useParams } from "react-router";
import { isStepSlug, stepCopy } from "../../copy/en";
import { BiologyTargets } from "../../steps/BiologyTargets";
import { CandidatesStep } from "../../steps/CandidatesStep";
import { DiseaseSearch } from "../../steps/DiseaseSearch";
import { EvidenceStep } from "../../steps/EvidenceStep";
import { Panel } from "../Figure";
import { StepPlaceholder } from "../StepPlaceholder";
import type { StepContext } from "./ExperimentLayout";

/** One step's own panels, placed into the layout's figure grid beside the network. */
export function StepFigure() {
  const { step } = useParams();
  const { experiment } = useOutletContext<StepContext>();
  if (!isStepSlug(step)) return null;

  const ready = experiment?.status === "ready" ? experiment : undefined;
  switch (step) {
    case "disease":
      return <DiseaseSearch key={experiment?.id} current={experiment} />;
    case "biology":
      return ready && <BiologyTargets experiment={ready} />;
    case "candidates":
      return ready && <CandidatesStep experiment={ready} />;
    case "evidence":
      return ready && <EvidenceStep experiment={ready} />;
    default:
      return (
        <Panel area="main" label={stepCopy(step).title}>
          <StepPlaceholder step={step} />
        </Panel>
      );
  }
}
