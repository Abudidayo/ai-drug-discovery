import type { CSSProperties } from "react";
import type { Decision } from "../api/types";
import { copy } from "../copy/en";
import { markerNudges, rankPosition, rankTicks, rowMinHeight } from "./dotPlotLayout";
import styles from "./DotPlot.module.css";
import { Marker } from "./Marker";

/** A model on the jury: its name to show and its marker, fixed by its place in the jury. */
export interface DotPlotModel {
  id: string;
  name: string;
  marker: number;
}

/** One drug: each model's rank and decision, in model order; null where it has no vote. */
export interface DotPlotRow {
  id: string;
  name: string;
  ranks: (number | null)[];
  decisions: (Decision | null)[];
  /** The models chose different decisions: drawn once, in the contested colour. */
  contested: boolean;
}

interface DotPlotProps {
  models: readonly DotPlotModel[];
  rows: readonly DotPlotRow[];
  /** The last rank on the axis: the number of drugs reviewed. */
  maxRank: number;
  hovered: string | null;
  onHover: (id: string | null) => void;
}

const ROW_HEIGHT = 26;
const CONTESTED_ROW = "minmax(72px, 2.4fr)";

/**
 * The Model jury's dot plot (docs/design.md, "Dot plot"): one row per drug, one marker shape per
 * model, placed at the rank that model gave it, then each model's decision in its own column.
 * Where the models agree on the decision it reads as one row; a split decision is drawn once,
 * in the contested colour, with each model on its own line so the split is plain.
 */
/** A row's grid track: a split decision gets a line per model; ties get room to fan out. */
function rowTrack(row: DotPlotRow): string {
  if (row.contested) return CONTESTED_ROW;
  return `minmax(${String(rowMinHeight(row.ranks, ROW_HEIGHT))}px, 1fr)`;
}

export function DotPlot({ models, rows, maxRank, hovered, onHover }: DotPlotProps) {
  const style: CSSProperties = {
    // Model names wrap rather than widen their column, so long names ("Practice reviewer A",
    // "Claude Opus 5.5") never push the table past its panel.
    gridTemplateColumns: `max-content minmax(120px, 2.2fr) repeat(${String(models.length)}, minmax(6.5em, 1fr))`,
    gridTemplateRows: `auto ${rows.map(rowTrack).join(" ")} auto`,
  };
  const contestedCount = rows.filter((row) => row.contested).length;
  const anyContested = contestedCount > 0;

  return (
    <div className={styles.chart}>
      <div className={styles.scroll}>
        <div role="table" aria-label={copy.jury.plotLabel} className={styles.table} style={style}>
          <div role="row" className={styles.head}>
            <span role="columnheader" className={styles.drugHead}>
              <span className={styles.hidden}>{copy.jury.drug}</span>
            </span>
            <span role="columnheader">{copy.jury.rank}</span>
            {models.map((model) => (
              <span role="columnheader" key={model.id} className={styles.model}>
                <Marker index={model.marker} />
                {model.name}
              </span>
            ))}
          </div>

          {rows.map((row) => (
            <PlotRow
              key={row.id}
              row={row}
              models={models}
              maxRank={maxRank}
              on={hovered === row.id}
              onHover={onHover}
            />
          ))}

          <div className={styles.axis} aria-hidden="true">
            <div className={styles.track}>
              {rankTicks(maxRank).map((rank) => (
                <span
                  key={rank}
                  className={styles.tick}
                  style={{ left: `${String(rankPosition(rank, maxRank))}%` }}
                >
                  {rank}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {anyContested && (
        <p className={styles.key}>
          <span className={styles.swatch} aria-hidden="true" />
          <span>
            <b>{copy.jury.contestedTitle}.</b> {copy.jury.contestedNote(contestedCount)}
          </span>
        </p>
      )}
    </div>
  );
}

interface PlotRowProps {
  row: DotPlotRow;
  models: readonly DotPlotModel[];
  maxRank: number;
  on: boolean;
  onHover: (id: string | null) => void;
}

function PlotRow({ row, models, maxRank, on, onHover }: PlotRowProps) {
  const voted = row.ranks.flatMap((rank) => (rank === null ? [] : [rank]));
  const low = Math.min(...voted);
  const high = Math.max(...voted);
  const nudges = markerNudges(row.ranks);
  const lines = row.contested ? models.length : 1;
  // Contested rows give each model its own line; otherwise every marker sits on the middle one.
  const lineTop = (index: number) =>
    `${String((((row.contested ? index : 0) + 0.5) / lines) * 100)}%`;
  const ranksLabel = models
    .flatMap((model, index) => {
      const rank = row.ranks[index];
      return rank == null ? [] : [copy.jury.rankOf(model.name, rank)];
    })
    .join(", ");

  return (
    <div
      role="row"
      className={styles.row}
      data-contested={row.contested || undefined}
      data-on={on || undefined}
      data-testid={`jury-row-${row.id}`}
      onPointerEnter={() => {
        onHover(row.id);
      }}
      onPointerLeave={() => {
        onHover(null);
      }}
    >
      <span role="rowheader" className={styles.name}>
        {row.name}
      </span>
      <span role="cell" className={styles.plot} aria-label={ranksLabel}>
        <span className={styles.track}>
          {Array.from({ length: lines }, (_, index) => (
            <span key={index} className={styles.guide} style={{ top: lineTop(index) }} />
          ))}
          {!row.contested && voted.length > 1 && (
            <span
              className={styles.range}
              style={{
                left: `${String(rankPosition(low, maxRank))}%`,
                width: `${String(rankPosition(high, maxRank) - rankPosition(low, maxRank))}%`,
              }}
            />
          )}
          {models.map((model, index) => {
            const rank = row.ranks[index];
            if (rank == null) return null;
            return (
              <span
                key={model.id}
                className={styles.mark}
                style={{
                  left: `${String(rankPosition(rank, maxRank))}%`,
                  top: row.contested
                    ? lineTop(index)
                    : `calc(50% + ${String(nudges[index] ?? 0)}px)`,
                }}
              >
                <Marker index={model.marker} />
              </span>
            );
          })}
        </span>
      </span>
      {models.map((model, index) => {
        const decision = row.decisions[index] ?? null;
        return (
          <span role="cell" key={model.id} className={styles.decisions}>
            {Array.from({ length: lines }, (_, line) => (
              <span key={line} className={styles.line}>
                {decision !== null && (!row.contested || line === index) && (
                  <span className={styles.decision} data-decision={decision}>
                    {copy.jury.decisions[decision]}
                  </span>
                )}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}
