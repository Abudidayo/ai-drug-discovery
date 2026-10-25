import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router";
import { useConformer } from "../api/queries";
import type { Candidate, EvidenceItem, Experiment } from "../api/types";
import { FigureNote, Panel } from "../app/Figure";
import { useNetworkHover } from "../app/networkHover";
import { copy } from "../copy/en";
import { focusCandidate } from "../lib/candidates";
import { capitalise, drugName, listOf } from "../lib/format";
import styles from "./EvidenceStep.module.css";

/** The query parameter that picks which Candidate the Evidence step is about. */
export const DRUG_PARAM = "drug";

const MoleculeFigure = lazy(() =>
  import("../three/MoleculeFigure").then((module) => ({ default: module.MoleculeFigure })),
);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Link text for a source record: the database, or DailyMed for drug labels. */
function sourceLabel(item: EvidenceItem): string {
  try {
    if (new URL(item.url).hostname.endsWith("dailymed.nlm.nih.gov")) return "DailyMed";
  } catch {
    // Not a URL we can read; name the database instead.
  }
  return copy.evidence.sources[item.source];
}

function MoleculePanel({ candidate }: { candidate: Candidate }) {
  const name = drugName(candidate.name);
  const conformer = useConformer(candidate.pubchem_cid);
  let body;
  if (candidate.pubchem_cid === null || conformer.data === null) {
    body = <FigureNote>{copy.evidence.noModel}</FigureNote>;
  } else if (conformer.isError) {
    body = (
      <FigureNote>
        <p>{copy.evidence.modelUnavailable}</p>
        <button type="button" className={styles.retry} onClick={() => void conformer.refetch()}>
          {copy.retry}
        </button>
      </FigureNote>
    );
  } else if (conformer.data === undefined) {
    body = null;
  } else {
    body = (
      <Suspense fallback={null}>
        <MoleculeFigure conformer={conformer.data} name={name} />
      </Suspense>
    );
  }
  return (
    <Panel area="molecule" title={name}>
      {body}
    </Panel>
  );
}

/**
 * The label risks as one plain sentence, from each cited warning's summary, e.g. "Serious
 * infections, cancer and lung problems."
 */
function warningSentence(candidate: Candidate): string {
  const byId = new Map(candidate.evidence.map((item) => [item.id, item]));
  const risks: string[] = [];
  for (const warning of candidate.warnings) {
    const summary = byId.get(warning.evidence_id)?.summary.replace(/\.$/, "");
    if (summary === undefined) continue;
    const risk = summary.charAt(0).toLowerCase() + summary.slice(1);
    if (!risks.includes(risk)) risks.push(risk);
  }
  return `${capitalise(listOf(risks))}.`;
}

function WarningBox({ candidate }: { candidate: Candidate }) {
  if (candidate.warnings.length === 0) {
    return (
      <div className={styles.noWarning} role="note">
        <p>{copy.evidence.noWarnings}</p>
      </div>
    );
  }
  const cited = new Set(candidate.warnings.map((warning) => warning.evidence_id));
  const sources = new Map<string, EvidenceItem>();
  for (const item of candidate.evidence) {
    if (cited.has(item.id) && !sources.has(item.url)) sources.set(item.url, item);
  }
  return (
    <div className={styles.warning} role="note" aria-labelledby="label-warning-title">
      <p id="label-warning-title" className={styles.warningTitle}>
        {copy.evidence.warningTitle}
      </p>
      <div className={styles.warningText}>
        <p>{warningSentence(candidate)}</p>
      </div>
      <div className={styles.warningSources}>
        {[...sources.values()].map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noreferrer">
            {sourceLabel(item)}
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 4: one drug's evidence. The molecule in 3D (or a plain line for antibodies), the sourced
 * facts with links, and its label warnings, said once in the warning box and never repeated as
 * a fact. Hovering a fact points at the proteins it names in the network.
 */
export function EvidenceStep({ experiment }: { experiment: Experiment }) {
  const [params] = useSearchParams();
  const setHover = useNetworkHover();
  const candidate = focusCandidate(experiment.candidates, params.get(DRUG_PARAM));
  if (candidate === undefined) return null;

  const facts = candidate.evidence.filter((item) => item.kind !== "warning");
  const symbols = experiment.network?.nodes ?? [];
  const point = (item: EvidenceItem | null) => {
    if (item === null) {
      setHover(null);
      return;
    }
    const named = symbols
      .filter((node) => new RegExp(`\\b${escapeRegExp(node.symbol)}\\b`).test(item.summary))
      .map((node) => node.id);
    setHover(named.length > 0 ? { highlight: named, focus: named } : null);
  };

  return (
    <>
      <MoleculePanel key={candidate.candidate_id} candidate={candidate} />
      <Panel area="evidence" label={copy.evidence.listLabel}>
        <div className={styles.scroll}>
          {facts.length > 0 && (
            <ul className={styles.facts} aria-label={copy.evidence.listLabel}>
              {facts.map((item) => (
                <li
                  key={item.id}
                  onPointerEnter={() => {
                    point(item);
                  }}
                  onPointerLeave={() => {
                    point(null);
                  }}
                >
                  <span>{item.summary}</span>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {sourceLabel(item)}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <WarningBox candidate={candidate} />
        </div>
      </Panel>
    </>
  );
}
