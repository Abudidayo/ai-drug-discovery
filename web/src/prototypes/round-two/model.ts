import { useState } from "react";
import { candidates, initialCandidate } from "../data";
import type { DemoCandidate } from "../data";
import { useIllustrationPlayback, useTour } from "../hooks";

export {
  candidates,
  initialCandidate,
  diseaseTargets,
  reviewers,
  workflowSteps,
  exportCandidates,
} from "../data";
export type { DemoCandidate } from "../data";
export type Tab = "why" | "workflow" | "results";
export const navigation = [
  { id: "why", label: "Problem & solution" },
  { id: "workflow", label: "Workflow" },
  { id: "results", label: "Results" },
] as const;

export const facts = {
  problem:
    "Disease links, drug targets, pathways and safety records live in different places. Researchers have to connect them before deciding what to investigate.",
  solution:
    "We connect public biomedical evidence with a human protein network, then ask three independent AI models to challenge a shortlist of existing medicines.",
  selection:
    "10 candidates from physical-network Random Walk with Restart + 5 from direct disease–target evidence. Overlaps are deduplicated and refilled where coverage permits.",
  limit:
    "Research priorities, not treatment predictions. Network associations, AI reviews and binding poses are hypotheses requiring experimental validation.",
  demo: "Illustrative COVID-19 fixture · Ranks, scores and AI reviews are fictional",
  fixture:
    "The table uses the legacy proximity fixture to demonstrate the interface. The current application uses the 10 + 5 RWR/evidence selection policy.",
  path: "Protein paths explain proximity, not RWR diffusion or a proven therapeutic mechanism.",
  docking:
    "Optional Docker-based preparation and AutoDock Vina docking use experimental RCSB PDB structures. A predicted pose is a geometric hypothesis; docking does not determine the ranking.",
};

export function useDemoMotion() {
  const playback = useIllustrationPlayback();
  const [revision, setRevision] = useState(0);
  return {
    ...playback,
    revision,
    replay: () => {
      setRevision((value) => value + 1);
      if (!playback.playing && !playback.reduced) playback.toggle();
    },
  };
}
export type DemoMotion = ReturnType<typeof useDemoMotion>;

export function useSite() {
  const [tab, setTab] = useState<Tab>("why");
  const tour = useTour();
  const motion = useDemoMotion();
  const go = (next: Tab) => {
    setTab(next);
    if (next === "workflow") tour.start();
    else tour.pause();
    motion.replay();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return { tab, go, tour, motion };
}
export type Site = ReturnType<typeof useSite>;

export type Sort = "shortlist" | "network" | "evidence" | "jury" | "name";
export function useCandidateBrowser() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("shortlist");
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState(initialCandidate.candidate_id);
  const filtered = candidates
    .filter((candidate) =>
      `${candidate.displayName} ${candidate.targets.map((target) => target.name).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "name") return a.displayName.localeCompare(b.displayName);
      if (sort === "network") return (a.network?.rank ?? Infinity) - (b.network?.rank ?? Infinity);
      if (sort === "evidence")
        return (a.direct_evidence_rank ?? Infinity) - (b.direct_evidence_rank ?? Infinity);
      if (sort === "jury") return (a.juryRank ?? Infinity) - (b.juryRank ?? Infinity);
      return a.shortlist_rank - b.shortlist_rank;
    });
  const rows = showAll || query.trim() ? filtered : filtered.slice(0, 5);
  const active =
    rows.find((candidate) => candidate.candidate_id === selectedId) ?? rows[0] ?? initialCandidate;
  const choose = (candidate: DemoCandidate) => {
    setSelectedId(candidate.candidate_id);
    if (!rows.some((row) => row.candidate_id === candidate.candidate_id)) setShowAll(true);
  };
  return {
    rows,
    active,
    filtered,
    query,
    setQuery,
    sort,
    setSort,
    showAll,
    setShowAll,
    choose,
    total: candidates.length,
  };
}
export type CandidateBrowser = ReturnType<typeof useCandidateBrowser>;
export function rank(value: number | null | undefined) {
  return value == null ? "Unavailable" : `#${String(value)}`;
}
export function targets(candidate: DemoCandidate) {
  return candidate.targets.map((target) => target.name).join(" · ") || "Unmapped targets";
}
