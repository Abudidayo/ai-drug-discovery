import { useRef, type ReactNode } from "react";
import { copy, networkWarningText } from "../copy/en";
import { signed } from "../lib/format";
import { useElementSize } from "../lib/useElementSize";
import {
  closenessDomain,
  evidenceSlots,
  missingGroups,
  rankBreaks,
  type SlopeRow,
} from "./slopeLayout";
import styles from "./SlopeChart.module.css";

export type { SlopeRow } from "./slopeLayout";

interface SlopeChartProps {
  rows: readonly SlopeRow[];
  hovered: string | null;
  onHover: (id: string | null) => void;
  /** The known-answer note; shown only when its drug is on the chart. */
  knownAnswerNote: string | null;
  /** Shown straight under the rows, before the notes. */
  below?: ReactNode;
}

const HEAD = 40; // column titles
const AXIS = 34; // the closeness axis under the rows
const ROOMY_ROWS = 6; // up to this many rows get the roomy pitch
const ROOMY_PITCH = 40;
const DENSE_PITCH = 28;
const CHAR = 8.1; // average width of a 15px Instrument Sans character
const DIGIT = 7.4; // width of a 13px tabular digit
const TICK_INSET = 12; // half the widest closeness tick ("−5"), so the first tick isn't clipped

/** A zig-zag across a vertical axis where ranks jump, so a gap never reads as a step of one. */
function AxisBreak({ x, y }: { x: number; y: number }) {
  return (
    <g className={styles.break}>
      <rect x={x - 6} y={y - 4} width={12} height={8} />
      <path
        d={`M${String(x - 5)} ${String(y - 1)}l10 -4M${String(x - 5)} ${String(y + 4)}l10 -4`}
      />
    </g>
  );
}

/**
 * The candidate drugs' slope chart (docs/design.md, "Slope chart"). Each drug is named once, on
 * its row: closeness on the left, then its name and network rank, then a line to its evidence
 * rank on the right. Both rank axes are ordinal and labelled with the true ranks; where ranks
 * jump, the axis shows a break. A drug whose closeness can't be measured gets no dot (never a
 * zero): "Not measured", once per reason, with the reason as a numbered note.
 */
export function SlopeChart({ rows, hovered, onHover, knownAnswerNote, below }: SlopeChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(boxRef);

  const count = rows.length;
  const pitch = count <= ROOMY_ROWS ? ROOMY_PITCH : DENSE_PITCH;
  const y = (index: number) => HEAD + index * pitch + pitch / 2;
  const svgHeight = HEAD + count * pitch + AXIS;

  const narrow = width < 560;
  const longest = Math.max(4, ...rows.map((row) => row.name.length));
  const stripEnd = Math.round(Math.min(250, Math.max(narrow ? 96 : 150, width * 0.28)));
  const nameEnd = stripEnd + (narrow ? 16 : 32) + Math.ceil(longest * CHAR);
  // Room between the names and the rank axis for the longest network rank, e.g. 1309.
  const rankDigits = Math.max(1, ...rows.map((row) => String(row.networkRank).length));
  const left = nameEnd + 18 + Math.ceil(rankDigits * DIGIT) + 0.5;
  const right = Math.round(width - 44) + 0.5;

  const measured = rows.flatMap((row) => (row.closeness === null ? [] : [row.closeness]));
  const [low, high] = closenessDomain(measured);
  const zx = (z: number) => TICK_INSET + ((z - low) / (high - low)) * (stripEnd - TICK_INSET);
  const zTicks: number[] = [];
  for (let t = Math.ceil(low); t <= Math.floor(high); t++) zTicks.push(t);

  const slots = evidenceSlots(rows);
  const byEvidence = [...slots.entries()].map(([id, slot]) => ({
    slot,
    rank: rows.find((row) => row.id === id)?.evidenceRank ?? 0,
  }));
  const groups = missingGroups(rows);
  const warnings = [...new Set(groups.map((group) => group.warning))];
  const marker = (warning: SlopeRow["warning"]) =>
    warning === null ? 0 : 3 + warnings.indexOf(warning);
  const showKnownAnswer = knownAnswerNote !== null && rows.some((row) => row.emphasis);
  const axisY = HEAD + count * pitch + 6;

  return (
    <div className={styles.chart}>
      <div ref={boxRef}>
        {width > 0 && count > 0 && (
          <svg
            width={width}
            height={svgHeight}
            viewBox={`0 0 ${String(width)} ${String(svgHeight)}`}
            className={
              hovered === null ? styles.svg : `${styles.svg ?? ""} ${styles.hovering ?? ""}`
            }
            role="img"
            aria-label={copy.candidates.chartLabel}
          >
            <text className={styles.head} x={stripEnd / 2} y={16} textAnchor="middle">
              {copy.candidates.closeness}
              <tspan className={styles.sup} dx={2} dy={-6}>
                1
              </tspan>
            </text>
            <text
              className={styles.head}
              x={narrow ? left + 4 : left}
              y={16}
              textAnchor={narrow ? "end" : "middle"}
            >
              {copy.candidates.networkRank}
            </text>
            <text className={styles.head} x={width} y={16} textAnchor="end">
              {copy.candidates.evidenceRank}
              <tspan className={styles.sup} dx={2} dy={-6}>
                2
              </tspan>
            </text>

            {/* Closeness: a zero line, row guides and the axis under every row. */}
            {measured.length > 0 && (
              <g>
                <line
                  className={styles.zero}
                  x1={zx(0)}
                  x2={zx(0)}
                  y1={y(0) - pitch / 2}
                  y2={axisY}
                />
                <line className={styles.axis} x1={0} x2={stripEnd} y1={axisY} y2={axisY} />
                {zTicks.map((t) => (
                  <g key={t}>
                    <line className={styles.axis} x1={zx(t)} x2={zx(t)} y1={axisY} y2={axisY + 5} />
                    <text className={styles.tick} x={zx(t)} y={axisY + 19} textAnchor="middle">
                      {signed(t, 0)}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Rank axes, with breaks where ranks jump. */}
            <line
              className={styles.axis}
              x1={left}
              x2={left}
              y1={y(0) - 10}
              y2={y(count - 1) + 10}
            />
            {rankBreaks(rows.map((row) => row.networkRank)).map((i) => (
              <AxisBreak key={i} x={left} y={(y(i) + y(i + 1)) / 2} />
            ))}
            {byEvidence.length > 0 && (
              <line
                className={styles.axis}
                x1={right}
                x2={right}
                y1={y(0) - 10}
                y2={y(byEvidence.length - 1) + 10}
              />
            )}
            {rankBreaks(byEvidence.map((entry) => entry.rank)).map((i) => (
              <AxisBreak key={i} x={right} y={(y(i) + y(i + 1)) / 2} />
            ))}
            {byEvidence.map(({ slot, rank }) => (
              <g key={slot}>
                <line className={styles.axis} x1={right} x2={right + 5} y1={y(slot)} y2={y(slot)} />
                <text className={styles.tick} x={right + 9} y={y(slot) + 4}>
                  {rank}
                </text>
              </g>
            ))}

            {groups.map((group) => {
              const top = y(group.first) - pitch / 2 + 6;
              const bottom = y(group.last) + pitch / 2 - 6;
              return (
                <g key={group.first} className={styles.missing}>
                  <path d={`M4 ${String(top)}H0V${String(bottom)}H4`} />
                  <text x={12} y={(top + bottom) / 2 + 5}>
                    {copy.candidates.notMeasured}
                    <tspan className={styles.sup} dx={2} dy={-6}>
                      {marker(group.warning)}
                    </tspan>
                  </text>
                </g>
              );
            })}

            {rows.map((row, index) => {
              const rowY = y(index);
              const slot = slots.get(row.id);
              const rightY = slot === undefined ? null : y(slot);
              const className = [
                styles.row,
                row.emphasis ? styles.emphasis : "",
                hovered === row.id ? styles.on : "",
              ].join(" ");
              return (
                <g
                  key={row.id}
                  className={className}
                  data-testid={`slope-row-${row.id}`}
                  onPointerEnter={() => {
                    onHover(row.id);
                  }}
                  onPointerLeave={() => {
                    onHover(null);
                  }}
                >
                  <rect
                    className={styles.hit}
                    x={0}
                    y={rowY - pitch / 2}
                    width={width}
                    height={pitch}
                  />
                  {row.closeness !== null && (
                    <>
                      <line className={styles.guide} x1={0} x2={stripEnd} y1={rowY} y2={rowY} />
                      <circle className={styles.dot} cx={zx(row.closeness)} cy={rowY} r={5} />
                      <text className={styles.value} x={zx(row.closeness) + 10} y={rowY + 4.5}>
                        {signed(row.closeness)}
                      </text>
                    </>
                  )}
                  <text className={styles.name} x={nameEnd} y={rowY + 5} textAnchor="end">
                    {row.name}
                  </text>
                  <line className={styles.axis} x1={left - 5} x2={left} y1={rowY} y2={rowY} />
                  <text className={styles.tick} x={left - 9} y={rowY + 4} textAnchor="end">
                    {row.networkRank}
                  </text>
                  {rightY === null ? (
                    <text className={styles.unranked} x={left + 12} y={rowY + 4}>
                      {copy.candidates.notRanked}
                    </text>
                  ) : (
                    <>
                      <line className={styles.slope} x1={left} y1={rowY} x2={right} y2={rightY} />
                      <circle className={styles.point} cx={right} cy={rightY} r={4} />
                    </>
                  )}
                  <circle className={styles.point} cx={left} cy={rowY} r={4} />
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {below}
      <div className={styles.notes}>
        {showKnownAnswer && (
          <p className={styles.note}>
            <span className={styles.inkLine} aria-hidden="true" />
            <span>{knownAnswerNote}</span>
          </p>
        )}
        <p className={styles.note}>
          <sup>1</sup>
          <span>{copy.candidates.closenessHelp}</span>
        </p>
        <p className={styles.note}>
          <sup>2</sup>
          <span>{copy.candidates.evidenceRankHelp}</span>
        </p>
        {warnings.map((warning) => (
          <p key={warning} className={styles.note}>
            <sup>{marker(warning)}</sup>
            <span>{networkWarningText(warning)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
