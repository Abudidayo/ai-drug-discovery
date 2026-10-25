/**
 * Where a rank sits across the dot plot, as a percentage of the plot's width. Ranks are
 * ordinal, so each gets an equal slot and sits in its middle: 1 is leftmost.
 */
export function rankPosition(rank: number, maxRank: number): number {
  return ((rank - 0.5) / Math.max(1, maxRank)) * 100;
}

/** The rank axis's ticks: 1, then every fifth rank up to the last. */
export function rankTicks(maxRank: number): number[] {
  if (maxRank < 1) return [];
  if (maxRank < 5) return Array.from({ length: maxRank }, (_, index) => index + 1);
  const ticks = [1];
  for (let rank = 5; rank <= maxRank; rank += 5) ticks.push(rank);
  return ticks;
}

const NUDGE = 9;
const MARKER = 12;

/**
 * Vertical nudges, in pixels, so markers on the same rank don't hide each other: models that
 * share a rank fan out around the row's centre line; a model alone on its rank stays on it.
 */
export function markerNudges(ranks: readonly (number | null)[], step = NUDGE): number[] {
  return ranks.map((rank, index) => {
    if (rank === null) return 0;
    const sharing = ranks.flatMap((other, at) => (other === rank ? [at] : []));
    if (sharing.length < 2) return 0;
    return (sharing.indexOf(index) - (sharing.length - 1) / 2) * step;
  });
}

/**
 * The least height, in pixels, a row needs so the markers fanned out on its most shared rank
 * stay inside it, with `clearance` above and below: never less than `base`.
 */
export function rowMinHeight(
  ranks: readonly (number | null)[],
  base: number,
  clearance = 2,
): number {
  const counts = new Map<number, number>();
  for (const rank of ranks) if (rank !== null) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const deepest = Math.max(1, ...counts.values());
  return Math.max(base, (deepest - 1) * NUDGE + MARKER + 2 * clearance);
}
