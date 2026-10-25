import { workflowSteps, useSequence } from "./model";
import type { Direction, Website } from "./model";
import { Action, Controls, Icon } from "./shared";
import { StageList, StageVisual } from "./visuals";

export function Workflow({ direction, site }: { direction: Direction; site: Website }) {
  const motion = useSequence(4, 5200);
  const step = workflowSteps[motion.phase] ?? workflowSteps[0];
  return (
    <section className={`workflow-page workflow-${direction}`} data-playing={motion.playing}>
      <div className="page-title">
        <h1>
          {direction === "horizon" ? (
            <>
              From a question
              <br />
              to a possibility.
            </>
          ) : direction === "specimen" ? (
            <>
              Follow the evidence.
              <br />
              <em>Keep the questions.</em>
            </>
          ) : (
            <>
              A question in.
              <br />A research lead out.
            </>
          )}
        </h1>
        <div>
          <p>Four steps connect disease biology to existing compounds worth a closer look.</p>
          <Controls motion={motion} />
        </div>
      </div>
      {direction === "relay" ? (
        <>
          <StageList motion={motion} />
          <div className="relay-process">
            <div className="stage-description">
              <span className="step-count">STEP {motion.phase + 1} / 4</span>
              <h2>{step.question}</h2>
              <p>{step.body}</p>
              <p className="stage-source">{step.source}</p>
              <div className="stage-output">
                <Icon name="check" size={18} />
                <span>{step.output}</span>
              </div>
            </div>
            <StageVisual motion={motion} direction={direction} />
          </div>
        </>
      ) : (
        <div className="workflow-canvas">
          <StageList motion={motion} />
          <div className="workflow-explanation">
            <div className="stage-description">
              <span className="step-count">Step {motion.phase + 1} of 4</span>
              <h2>{step.question}</h2>
              <p>{step.body}</p>
            </div>
            <StageVisual motion={motion} direction={direction} />
            <div className="stage-output">
              <span>{step.source}</span>
              <strong>{step.output}</strong>
            </div>
          </div>
        </div>
      )}
      <div className="workflow-close">
        <p>
          The output is an inspectable research hypothesis.
          <br />
          The next experiment belongs to the researcher.
        </p>
        <Action
          onClick={() => {
            site.go("results");
          }}
        >
          Explore the results
        </Action>
      </div>
    </section>
  );
}
