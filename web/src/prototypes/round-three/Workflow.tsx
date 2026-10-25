import { useEffect, useRef, useState } from "react";
import type { Site } from "./model";
import { Brand, Icon, Tabs } from "./components";
import { storyImages, workflowStages } from "./workflow-content";
import { TechnicalOverview } from "./TechnicalOverview";
import { WorkflowDetails } from "./WorkflowDetails";
import "./workflow.css";

function initialStage() {
  const value = Number(new URLSearchParams(window.location.search).get("stage"));
  return Number.isInteger(value) && value >= 0 && value < workflowStages.length ? value : 0;
}

export function Workflow({ go }: Pick<Site, "go">) {
  const [view, setView] = useState(() =>
    new URLSearchParams(window.location.search).get("view") === "technical" ? "technical" : "story",
  );
  const [stage, setStage] = useState(initialStage);
  const sources = useRef<HTMLDialogElement>(null);
  const evidence = useRef<HTMLDialogElement>(null);
  const docking = useRef<HTMLDialogElement>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const current = workflowStages[stage] ?? workflowStages[0];

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    if (view === "story") url.searchParams.set("stage", String(stage));
    else url.searchParams.delete("stage");
    window.history.replaceState(null, "", url);
  }, [view, stage]);

  if (!current) throw new Error("Workflow content is missing");
  return (
    <div className="r2 half-life-workflow" data-view={view}>
      <header className="header">
        <button
          className="brand"
          type="button"
          onClick={() => {
            go("why");
          }}
          aria-label="Half Life home"
        >
          <Brand />
        </button>
        <div className="view-switch" role="group" aria-label="Explanation style">
          {(["story", "technical"] as const).map((choice) => (
            <button
              type="button"
              key={choice}
              aria-pressed={view === choice}
              onClick={() => {
                setView(choice);
              }}
            >
              {choice === "story" ? "Story" : "Technical"}
            </button>
          ))}
        </div>
        <div className="project-nav">
          <Tabs tab="workflow" go={go} />
        </div>
      </header>
      <div id="workflow-content" className="workflow-body" tabIndex={-1}>
        {view === "story" ? (
          <figure className="story-scene">
            <img id="story-art" src={storyImages[current.art - 1]} alt={current.story} />
            <figcaption className="sr-only">{current.story}</figcaption>
          </figure>
        ) : (
          <TechnicalOverview />
        )}
      </div>
      <footer className="chapter-footer">
        {view === "story" ? (
          <nav aria-label="Workflow chapters">
            {[
              "Connect biology",
              "Rank medicines",
              "Trace evidence",
              "AI jury",
              "Save & inspect",
            ].map((label, index) => (
              <button
                type="button"
                key={label}
                data-stage={index}
                aria-current={stage === index ? "step" : undefined}
                onClick={() => {
                  setStage(index);
                }}
              >
                <span>{index + 1}</span>
                {label}
              </button>
            ))}
          </nav>
        ) : (
          <div className="technical-actions">
            <button
              type="button"
              onClick={() => {
                evidence.current?.showModal();
              }}
            >
              Read evidence word for word
            </button>
            <button
              type="button"
              onClick={() => {
                docking.current?.showModal();
              }}
            >
              View docking details
            </button>
          </div>
        )}

        <button
          className="source-trigger"
          type="button"
          aria-expanded={sourcesOpen}
          aria-controls="workflow-sources"
          onClick={() => {
            sources.current?.showModal();
            setSourcesOpen(true);
          }}
        >
          Sources &amp; methods <Icon name="arrow" size={14} />
        </button>
      </footer>
      <WorkflowDetails
        sourcesRef={sources}
        evidenceRef={evidence}
        dockingRef={docking}
        onSourcesClose={() => {
          setSourcesOpen(false);
        }}
      />
    </div>
  );
}
