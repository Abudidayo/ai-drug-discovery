import { useId, useState } from "react";
import { ApiError } from "../api/errors";
import { useAskJury } from "../api/queries";
import type { Experiment, JuryRun } from "../api/types";
import { Panel } from "../app/Figure";
import { DotPlot, type DotPlotModel, type DotPlotRow } from "../charts/DotPlot";
import { Marker } from "../charts/Marker";
import { copy } from "../copy/en";
import { drugName, listOf } from "../lib/format";
import {
  countedJurors,
  excludedJurors,
  featuredObjection,
  juryRows,
  retriedCount,
} from "../lib/jury";
import styles from "./JuryStep.module.css";

/**
 * Step 5: the Model jury. Before it is asked, one button; while it reviews, each model's
 * progress; once done, the dot plot, the agreement between models and one objection. A failed
 * review says so plainly and never shows votes it doesn't have.
 */
export function JuryStep({ experiment }: { experiment: Experiment }) {
  const { jury } = experiment;
  if (jury === null) return <AskJury experiment={experiment} />;
  if (jury.status === "failed") {
    return (
      <Panel area="main" label={copy.jury.unavailable}>
        <div className={styles.status} role="alert">
          <p className={styles.headline}>{copy.jury.unavailable}</p>
          {jury.error !== null && <p className={styles.detail}>{jury.error}</p>}
        </div>
      </Panel>
    );
  }
  if (jury.status !== "done") {
    return (
      <Panel area="main" label={copy.jury.progressLabel}>
        <JuryProgress jury={jury} />
      </Panel>
    );
  }
  return <JuryResult experiment={experiment} jury={jury} />;
}

/** The API's own reason for a refusal (already archived, already asked), else a plain line. */
function askError(error: Error): string {
  if (error instanceof ApiError && !error.unreachable && error.detail !== null) return error.detail;
  return copy.jury.askFailed;
}

function AskJury({ experiment }: { experiment: Experiment }) {
  const ask = useAskJury(experiment.id);
  const reasonId = useId();
  const archived = experiment.archived_at !== null;
  const names = experiment.jury_config.models.map((model) => model.display_name);
  return (
    <Panel area="main" label={copy.jury.ask}>
      <div className={styles.status}>
        <p className={styles.lede}>{copy.jury.panel(listOf(names))}</p>
        <button
          type="button"
          className={styles.ask}
          disabled={archived || ask.isPending}
          aria-describedby={archived ? reasonId : undefined}
          onClick={() => {
            ask.mutate();
          }}
        >
          {copy.jury.ask}
        </button>
        {archived && (
          <p id={reasonId} className={styles.detail}>
            {copy.jury.archived}
          </p>
        )}
        {ask.error !== null && (
          <p className={styles.detail} role="alert">
            {askError(ask.error)}
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Each model's progress while the jury reviews, in plain words. */
function JuryProgress({ jury }: { jury: JuryRun }) {
  return (
    <div className={styles.status}>
      {jury.status === "queued" && (
        <p className={styles.detail} role="status">
          {copy.jury.queued}
        </p>
      )}
      <ol className={styles.jurors} aria-label={copy.jury.progressLabel} aria-live="polite">
        {jury.models.map((model, index) => {
          const status = jury.jurors[index]?.status ?? "pending";
          return (
            <li key={model.id} className={styles.juror} data-state={status}>
              <span className={styles.ring} aria-hidden="true" />
              <span className={styles.jurorName}>{model.display_name}</span>
              <span className={styles.jurorStatus}>{copy.jury.jurorStatus[status]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function JuryResult({ experiment, jury }: { experiment: Experiment; jury: JuryRun }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const counted = countedJurors(jury);
  const models: DotPlotModel[] = counted.map(({ model, marker }) => ({
    id: model.id,
    name: model.display_name,
    marker,
  }));
  const rows: DotPlotRow[] = juryRows(jury, experiment.candidates).map((row) => ({
    id: row.candidate.candidate_id,
    name: drugName(row.candidate.name),
    ranks: row.votes.map((vote) => vote?.rank ?? null),
    decisions: row.votes.map((vote) => vote?.decision ?? null),
    contested: row.contested,
  }));
  const maxRank = Math.max(experiment.candidates.length, ...jury.votes.map((vote) => vote.rank));
  const objection = featuredObjection(jury, experiment.candidates);
  const retried = retriedCount(jury);
  const excluded = excludedJurors(jury);

  return (
    <>
      <Panel area="plot" label={copy.jury.plotLabel}>
        {counted.length > 0 && (
          <DotPlot
            models={models}
            rows={rows}
            maxRank={maxRank}
            hovered={hovered}
            onHover={setHovered}
          />
        )}
        {(retried > 0 || excluded.length > 0) && (
          <div className={styles.notes}>
            {excluded.map(({ juror, status }) => (
              <p key={juror.model.id} className={styles.note}>
                <Marker index={juror.marker} />
                <span>{copy.jury.excluded[status](juror.model.display_name)}</span>
              </p>
            ))}
            {retried > 0 && (
              <p className={styles.note}>
                <span className={styles.indent} aria-hidden="true" />
                <span>{copy.jury.retried(retried)}</span>
              </p>
            )}
          </div>
        )}
      </Panel>
      <Panel area="agreement" title={copy.jury.agreement}>
        {jury.agreement === null ? (
          <p className={styles.detail}>{copy.jury.agreementMissing}</p>
        ) : (
          <AgreementScale value={jury.agreement} />
        )}
      </Panel>
      {objection !== null && (
        <Panel
          area="objection"
          title={
            <span className={styles.objectionTitle}>
              <Marker index={objection.juror.marker} />
              {copy.jury.objectionTitle(
                objection.juror.model.display_name,
                drugName(objection.candidate.name),
              )}
            </span>
          }
        >
          <blockquote
            className={styles.objection}
            onPointerEnter={() => {
              setHovered(objection.candidate.candidate_id);
            }}
            onPointerLeave={() => {
              setHovered(null);
            }}
          >
            <p>{objection.text}</p>
          </blockquote>
        </Panel>
      )}
    </>
  );
}

const SCALE_TICKS = [0, 0.5, 1];

/** Agreement on a 0 to 1 scale: the value, a filled bar up to it, and what it means, once. */
function AgreementScale({ value }: { value: number }) {
  const at = `${String(value * 100)}%`;
  return (
    <div className={styles.agreement}>
      <div className={styles.scale}>
        <span className={styles.fill} style={{ width: at }} aria-hidden="true" />
        <span className={styles.value} style={{ left: at }}>
          <b>{value.toFixed(2)}</b>
          <i aria-hidden="true" />
        </span>
        {SCALE_TICKS.map((tick) => (
          <span
            key={tick}
            className={styles.scaleTick}
            style={{ left: `${String(tick * 100)}%` }}
            aria-hidden="true"
          >
            {tick === 0.5 ? "0.5" : String(tick)}
          </span>
        ))}
      </div>
      <p className={styles.help}>{copy.jury.agreementHelp}</p>
    </div>
  );
}
