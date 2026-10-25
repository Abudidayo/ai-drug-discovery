import { Fragment, useState } from "react";
import type { RefObject } from "react";
import recorded from "../../../prototypes/workflow-review/recorded-evidence.json";
import methods from "./workflow-methods.json";
import { dockingImage, provenanceUrl } from "./workflow-content";

type DialogRef = RefObject<HTMLDialogElement | null>;
function Close({ label, target }: { label: string; target: DialogRef }) {
  return (
    <button
      className="close"
      type="button"
      aria-label={label}
      onClick={() => target.current?.close()}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 4 8 8m0-8-8 8" />
      </svg>
    </button>
  );
}

export function WorkflowDetails({
  sourcesRef,
  evidenceRef,
  dockingRef,
  onSourcesClose,
}: {
  sourcesRef: DialogRef;
  evidenceRef: DialogRef;
  dockingRef: DialogRef;
  onSourcesClose: () => void;
}) {
  const [evidenceId, setEvidenceId] = useState("E2");
  const item = recorded.evidence.find((item) => item.id === evidenceId) ?? recorded.evidence[0];
  if (!item) throw new Error("Recorded evidence is missing");
  return (
    <>
      <dialog
        id="workflow-sources"
        ref={sourcesRef}
        aria-labelledby="sources-title"
        onClose={onSourcesClose}
      >
        <Close label="Close sources" target={sourcesRef} />
        <h2 id="sources-title">Sources &amp; methods</h2>
        <p>
          This workflow follows the supplied Devpost draft and the repository’s current research
          workflow.
        </p>
        <dl>
          {methods.map(({ term, description }) => (
            <Fragment key={term}>
              <dt>{term}</dt>
              <dd>{description}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="source-caveat">
          Model names follow the jury selected in <code>plan.md</code> on 25 October. Live model IDs
          are configured per experiment. The older results fixture uses a different jury and
          fictional ranks and reviews.
        </p>
        <a href={provenanceUrl}>Read the repository evidence</a>
      </dialog>
      <dialog id="evidence-detail" ref={evidenceRef} aria-labelledby="evidence-title">
        <Close label="Close evidence" target={evidenceRef} />
        <h2 id="evidence-title">Evidence and review, word for word.</h2>
        <p>
          Archived {recorded.model_id} review · {recorded.prompt_version} ·{" "}
          {recorded.candidate.name} · {recorded.disease.name}
        </p>
        <p>
          This saved example preserves the original evidence statements and model wording. It is an
          archived review, rather than a new AI response.
        </p>
        <label htmlFor="evidence-select">Read a cited evidence item</label>
        <select
          id="evidence-select"
          value={evidenceId}
          onChange={(event) => { setEvidenceId(event.target.value); }}
        >
          {recorded.evidence.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} · {item.kind.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <p className="evidence-metadata">
          {item.id} · {item.source} · {item.source_id} · {item.release}
        </p>
        <h3>Stored evidence statement</h3>
        <blockquote id="evidence-statement" aria-live="polite">
          {item.statement}
        </blockquote>
        <p>
          {Object.entries(item.values)
            .map(([name, value]) => `${name}: ${String(value)}`)
            .join(" · ") || "No numeric measurements in this item."}
        </p>
        <a id="evidence-original" href={item.url} target="_blank" rel="noreferrer">
          Open original source record
        </a>
        <h3>Exact model rationale</h3>
        <blockquote id="review-rationale">{recorded.review.rationale}</blockquote>
        <p>Supporting evidence cited by this review:</p>
        <div id="review-citations" aria-label="Supporting evidence citations">
          {recorded.review.supporting_evidence_ids.map((id) => (
            <button
              type="button"
              key={id}
              aria-label={`Read cited evidence ${id}`}
              aria-pressed={id === evidenceId}
              onClick={() => { setEvidenceId(id); }}
            >
              {id}
            </button>
          ))}
        </div>
        <h3>Exact model objection</h3>
        <blockquote id="review-objection">{recorded.review.objection}</blockquote>
        <p className="source-caveat">
          E-IDs are local to this experiment. Citation and numeric checks establish structural
          consistency; scientific interpretation still needs review.
        </p>
      </dialog>
      <dialog
        id="docking-detail"
        className="docking-detail"
        ref={dockingRef}
        aria-labelledby="docking-title"
      >
        <Close label="Close docking" target={dockingRef} />
        <h2 id="docking-title">An optional structural investigation.</h2>
        <p>
          Experimental RCSB PDB structures and ligand preparation feed AutoDock Vina. TigerData
          stores job state and result metadata; pose files remain in file storage.
        </p>
        <img
          src={dockingImage}
          alt="Compare evidence and preserve the experiment. Separately, supported RCSB PDB structures and ligands undergo Docker preparation and AutoDock Vina docking for 3D pose inspection."
        />
        <p>
          Predicted geometry does not establish treatment benefit and does not determine the
          candidate ranking.
        </p>
      </dialog>
    </>
  );
}
