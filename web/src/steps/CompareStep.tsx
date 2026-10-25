import { useQueries } from "@tanstack/react-query";
import { type CSSProperties, lazy, Suspense, useState, type ReactNode } from "react";
import { conformerQuery, useStructures } from "../api/queries";
import type { Candidate, DockJob, Experiment, JuryRun, Structure } from "../api/types";
import { DrugPicker } from "../app/DrugPicker";
import { Panel } from "../app/Figure";
import { Marker } from "../charts/Marker";
import { copy, stepCopy } from "../copy/en";
import { approvals, defaultPicks, noModelText, warningSentence } from "../lib/candidates";
import { structureFor } from "../lib/docking";
import { drugName, listOf } from "../lib/format";
import { decisionsFor } from "../lib/jury";
import type { StripItem } from "../three/MoleculeStrip";
import styles from "./CompareStep.module.css";

/** How many of a drug's targets are named before "and N more". */
const TARGETS_SHOWN = 4;

const MoleculeStrip = lazy(() =>
  import("../three/MoleculeStrip").then((module) => ({ default: module.MoleculeStrip })),
);

const LIVE: readonly DockJob["status"][] = ["queued", "running"];

/** Whether a binding pose exists, is being computed, could be computed, or can't be. */
function poseText(
  candidate: Candidate,
  jobs: readonly DockJob[],
  structures: readonly Structure[] | undefined,
): string | null {
  const own = jobs.filter(
    (job) => job.kind === "candidate" && job.candidate_id === candidate.candidate_id,
  );
  const symbol = (targetId: string, structureId?: string) =>
    structures?.find((s) => s.id === structureId)?.target_symbol ??
    candidate.targets.find((target) => target.id === targetId)?.name ??
    targetId;
  const done = own.find((job) => job.status === "done");
  if (done) return copy.compare.pose.done(symbol(done.target_id, done.structure_id));
  const live = own.find((job) => LIVE.includes(job.status));
  if (live) return copy.compare.pose.running(symbol(live.target_id, live.structure_id));
  if (!candidate.dockable) return copy.compare.pose.unavailable;
  if (structures === undefined) return null;
  const structure = structureFor(candidate, structures);
  return structure
    ? copy.compare.pose.possible(structure.target_symbol)
    : copy.compare.pose.unavailable;
}

function targetsText(candidate: Candidate): string {
  const names = candidate.targets.map((target) => target.name);
  if (names.length === 0) return copy.compare.none;
  if (names.length <= TARGETS_SHOWN) return listOf(names);
  return copy.compare.moreTargets(
    names.slice(0, TARGETS_SHOWN).join(", "),
    names.length - TARGETS_SHOWN,
  );
}

function rank(value: number | null | undefined): ReactNode {
  return value ?? <span className={styles.quiet}>{copy.candidates.notRanked}</span>;
}

/** The jury's decision: one word when the models agree, each model's word when they split. */
function Decision({ jury, candidateId }: { jury: JuryRun; candidateId: string }) {
  const decisions = decisionsFor(jury, candidateId);
  const first = decisions[0];
  if (first === undefined) return <span className={styles.quiet}>{copy.compare.none}</span>;
  if (decisions.every((entry) => entry.decision === first.decision)) {
    return (
      <span className={styles.decision} data-decision={first.decision}>
        {copy.jury.decisions[first.decision]}
      </span>
    );
  }
  return (
    <div className={styles.split}>
      <span className={styles.splitTitle}>
        <span className={styles.swatch} aria-hidden="true" />
        {copy.jury.contestedTitle}
      </span>
      <ul className={styles.splitList}>
        {decisions.map(({ juror, decision }) => (
          <li key={juror.model.id}>
            <Marker index={juror.marker} />
            <span className={styles.hidden}>{juror.model.display_name}: </span>
            <span className={styles.decision} data-decision={decision}>
              {copy.jury.decisions[decision]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Step 6: three drugs side by side, each swappable for another on this Experiment's shortlist.
 * Each row is labelled once, on the left; the molecules share one canvas, so the step costs a
 * single WebGL context however many columns it draws.
 */
export function CompareStep({ experiment }: { experiment: Experiment }) {
  const { candidates, jury } = experiment;
  const [picks, setPicks] = useState(() => defaultPicks(candidates));
  const structures = useStructures();
  const chosen = picks.flatMap((id) => candidates.find((c) => c.candidate_id === id) ?? []);
  const conformers = useQueries({
    queries: chosen.map((candidate) => conformerQuery(candidate.pubchem_cid)),
  });

  const items: StripItem[] = chosen.map((candidate, index) => {
    const name = drugName(candidate.name);
    const query = conformers[index];
    if (query?.data) return { key: candidate.candidate_id, name, conformer: query.data };
    let message: string | null = null;
    if (candidate.pubchem_cid === null || query?.data === null) message = noModelText(candidate);
    else if (query?.isError) message = copy.evidence.modelUnavailable;
    return { key: candidate.candidate_id, name, message };
  });

  // With no network ranking, the network-rank row says "not ranked" once, across every drug.
  const networkRanked = experiment.ranking_method === "network";
  const rows: {
    label: string;
    cell: (candidate: Candidate) => ReactNode;
    whole?: ReactNode;
  }[] = [
    {
      label: copy.candidates.networkRank,
      cell: (c) => rank(c.network?.rank),
      whole: networkRanked ? undefined : (
        <span className={styles.quiet}>{copy.candidates.notRanked}</span>
      ),
    },
    { label: copy.candidates.evidenceRank, cell: (c) => rank(c.direct_evidence_rank) },
    ...(jury?.status === "done"
      ? [
          {
            label: copy.compare.decision,
            cell: (c: Candidate) => <Decision jury={jury} candidateId={c.candidate_id} />,
          },
        ]
      : []),
    { label: copy.compare.targets, cell: targetsText },
    {
      label: copy.compare.approval,
      cell: (c) => {
        const lines = approvals(c);
        return lines.length > 0 ? (
          lines.join(" ")
        ) : (
          <span className={styles.quiet}>{copy.compare.notRecorded}</span>
        );
      },
    },
    {
      label: copy.evidence.warningTitle,
      cell: (c) =>
        warningSentence(c) ?? <span className={styles.quiet}>{copy.compare.noWarnings}</span>,
    },
    {
      label: copy.compare.dockable,
      cell: (c) => poseText(c, experiment.dock_jobs, structures.data),
    },
  ];

  const pick = (column: number, id: string) => {
    setPicks((current) => current.map((value, index) => (index === column ? id : value)));
  };

  return (
    <Panel area="main" label={stepCopy("compare").title}>
      <div
        role="table"
        aria-label={copy.compare.tableLabel}
        className={styles.table}
        style={{ "--drugs": chosen.length } as CSSProperties}
      >
        <div role="row" className={styles.head}>
          <span role="columnheader" className={styles.corner} />
          {chosen.map((candidate, column) => (
            <span role="columnheader" key={column} className={styles.pick}>
              <DrugPicker
                label={copy.compare.pick}
                value={candidate.candidate_id}
                options={candidates.map((option) => ({
                  id: option.candidate_id,
                  name: drugName(option.name),
                  disabled:
                    option.candidate_id !== candidate.candidate_id &&
                    picks.includes(option.candidate_id),
                }))}
                onChange={(id) => {
                  pick(column, id);
                }}
              />
            </span>
          ))}
        </div>
        <div className={styles.band}>
          <Suspense fallback={null}>
            <MoleculeStrip items={items} />
          </Suspense>
        </div>
        {rows.map((row) => (
          <div role="row" key={row.label} className={styles.row}>
            <span role="rowheader" className={styles.label}>
              {row.label}
            </span>
            {row.whole === undefined ? (
              chosen.map((candidate) => (
                <span role="cell" key={candidate.candidate_id} className={styles.cell}>
                  {row.cell(candidate)}
                </span>
              ))
            ) : (
              <span role="cell" className={styles.cell} data-whole="true">
                {row.whole}
              </span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
