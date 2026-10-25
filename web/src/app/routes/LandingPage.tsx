import { DiseaseSearch } from "../../steps/DiseaseSearch";
import { FigureGrid } from "../Figure";
import { Shell } from "../Shell";

/** `/`: step 1, choosing a Disease, before any Experiment exists. */
export function LandingPage() {
  return (
    <Shell step="disease">
      <FigureGrid layout="search">
        <DiseaseSearch />
      </FigureGrid>
    </Shell>
  );
}
