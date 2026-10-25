import { useEffect, useState } from "react";
import { useIllustrationPlayback } from "../hooks";

export { facts, rank, targets, useCandidateBrowser } from "../round-three/model";
export { candidates, reviewers, workflowSteps, exportCandidates } from "../data";
export type { DemoCandidate } from "../data";
export type { CandidateBrowser, Sort } from "../round-three/model";
export type Tab = "problem" | "workflow" | "results";
export type Direction = "horizon" | "specimen" | "relay";
export const tabs = [
  { id: "problem", label: "Problem & solution" },
  { id: "workflow", label: "Workflow" },
  { id: "results", label: "Results" },
] as const;

export function useSequence(count = 3, duration = 4500) {
  const playback = useIllustrationPlayback();
  const [phase, setPhase] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!playback.playing) return;
    const timer = window.setTimeout(() => {
      setPhase((value) => (value + 1) % count);
    }, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, playback.playing, count, duration, revision]);
  return {
    ...playback,
    phase,
    revision,
    choose: (value: number) => {
      setPhase(value);
      if (playback.playing) playback.toggle();
    },
    replay: () => {
      setPhase(0);
      setRevision((value) => value + 1);
      if (!playback.playing && !playback.reduced) playback.toggle();
    },
  };
}
export type Sequence = ReturnType<typeof useSequence>;

export function useWebsite() {
  const [tab, setTab] = useState<Tab>("problem");
  const go = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return { tab, go };
}
export type Website = ReturnType<typeof useWebsite>;
