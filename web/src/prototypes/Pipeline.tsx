import { MethodNotes } from "./MethodNotes";
import { workflowSteps } from "./data";
import { Button, Icon, SampleNotice } from "./ui";
import { useReducedMotion, type Tour } from "./hooks";
import { NetworkField, ReviewScene, SelectionScene, ShortlistScene } from "./visuals";

export function Pipeline({
  tour,
  onResults,
  layout = "horizontal",
}: {
  tour: Tour;
  onResults: () => void;
  layout?: "horizontal" | "vertical" | "compact";
}) {
  const step = workflowSteps[tour.step] ?? workflowSteps[0];
  const reduced = useReducedMotion();
  return (
    <div className={`pipeline pipeline-${layout}`}>
      <div className="pipeline-stages" aria-label="Workflow stages">
        {workflowSteps.map((item, index) => (
          <button
            key={item.title}
            className={index === tour.step ? "pipeline-stage-active" : ""}
            type="button"
            aria-pressed={index === tour.step}
            onClick={() => {
              tour.selectStep(index);
            }}
          >
            <span className="stage-number">
              {index < tour.step ? (
                <Icon name="check" size={16} />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <span>{item.title}</span>
            <span className="stage-track">
              <span style={{ transform: index < tour.step ? "scaleX(1)" : "scaleX(0)" }} />
              {index === tour.step && tour.playing && (
                <span
                  className="stage-timer"
                  key={`${String(tour.step)}-${String(tour.playing)}`}
                />
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="pipeline-body">
        <div className="pipeline-caption">
          <div>
            <h2>{step.question}</h2>
            <p>{step.body}</p>
          </div>
          <button
            type="button"
            className="play-control"
            onClick={tour.toggle}
            aria-label={
              reduced
                ? "Next workflow stage"
                : tour.playing
                  ? "Pause workflow animation"
                  : tour.step === 3
                    ? "Replay workflow animation"
                    : "Play workflow animation"
            }
          >
            <Icon
              name={
                reduced ? "arrow" : tour.playing ? "pause" : tour.step === 3 ? "replay" : "play"
              }
              size={17}
            />
            <span>
              {reduced
                ? "Next stage"
                : tour.playing
                  ? "Pause"
                  : tour.step === 3
                    ? "Replay"
                    : "Play walkthrough"}
            </span>
          </button>
        </div>
        <div className="pipeline-scene" data-running={tour.playing} key={tour.step}>
          {tour.step === 0 ? (
            <NetworkField layer="disease" running={tour.playing} />
          ) : tour.step === 1 ? (
            <SelectionScene running={tour.playing} />
          ) : tour.step === 2 ? (
            <ReviewScene />
          ) : (
            <ShortlistScene />
          )}
        </div>
        <div className="pipeline-outcome">
          <div>
            <span className="pipeline-output-icon">
              <Icon name={tour.step === 3 ? "flask" : "check"} />
            </span>
            <span>
              <strong>{step.output}</strong>
              <small>{step.source}</small>
            </span>
          </div>
          {tour.step === 3 ? (
            <Button onClick={onResults}>Explore the results</Button>
          ) : (
            <Button
              secondary
              onClick={() => {
                tour.selectStep(tour.step + 1);
              }}
            >
              Next stage
            </Button>
          )}
        </div>
        <SampleNotice />
        <MethodNotes />
      </div>
    </div>
  );
}
