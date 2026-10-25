import type { Narrative } from "./narrative";
import { LaboratoryScene } from "./LaboratoryScene";
import "./problem-story.css";

export function ProblemStory({
  narrative,
  fullViewport = false,
}: {
  narrative: Narrative;
  fullViewport?: boolean;
}) {
  return (
    <div
      className="problem-story"
      data-playing={narrative.motion.playing}
      data-chapter={narrative.chapter}
    >
      <LaboratoryScene
        key={narrative.motion.revision}
        fullViewport={fullViewport}
        chapter={narrative.chapter}
        playing={narrative.motion.playing}
        reduced={narrative.motion.reduced}
        instant={narrative.instant}
        manual={narrative.manual}
        revision={narrative.motion.revision}
      />
      <div className="problem-story-context">
        <p>
          Thousands of compounds. Years of testing.
          <br />
          <strong>A difficult choice about what to investigate next.</strong>
        </p>
        <span>Illustrative research journey</span>
      </div>
    </div>
  );
}
export function DevelopmentSource() {
  return (
    <p className="development-source">
      New-drug development: approximately 10–15 years from discovery to market; timelines vary.{" "}
      <a href="https://www.gao.gov/assets/gao-20-215sp.pdf" target="_blank" rel="noreferrer">
        GAO
      </a>
      . Thousands of compounds may enter discovery; few warrant further study.{" "}
      <a
        href="https://www.fda.gov/patients/drug-development-process/step-1-discovery-and-development"
        target="_blank"
        rel="noreferrer"
      >
        FDA
      </a>
      .
    </p>
  );
}
