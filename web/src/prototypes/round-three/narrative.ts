import { useEffect, useRef, useState } from "react";
import { useDemoMotion } from "./model";

export const problemCopy = {
  title: "The clues exist.\nThey’re scattered.",
  text: "New medicines can take 10–15 years to develop. Researchers screen thousands of compounds, then connect disease biology, drug targets and safety evidence to decide what deserves further testing.",
};
export const chapters = [
  { short: "In the lab", text: "A researcher starts with a question.", duration: 5200 },
  {
    short: "Years of testing",
    text: "Discovery, lab studies, clinical trials and review take time.",
    duration: 7200,
  },
  {
    short: "Many compounds",
    text: "Thousands of possibilities. Only a few warrant more study.",
    duration: 7800,
  },
  {
    short: "A different start",
    text: "Could an existing medicine offer a research lead?",
    duration: 7200,
  },
] as const;

export function useNarrative() {
  const playback = useDemoMotion();
  const [chapter, setChapter] = useState(0);
  const [cameraMode, setCameraMode] = useState<"instant" | "automatic" | "pointer">("instant");
  const elapsed = useRef(0);
  const generation = useRef(0);
  useEffect(() => {
    if (!playback.playing) return;
    const started = performance.now();
    const version = generation.current;
    let advanced = false;
    const timer = window.setTimeout(
      () => {
        advanced = true;
        elapsed.current = 0;
        setCameraMode("automatic");
        setChapter((value) => (value + 1) % chapters.length);
      },
      Math.max(0, (chapters[chapter] ?? chapters[0]).duration - elapsed.current),
    );
    return () => {
      window.clearTimeout(timer);
      if (!advanced && generation.current === version)
        elapsed.current += performance.now() - started;
    };
  }, [chapter, playback.playing, playback.revision]);
  return {
    chapter,
    instant: cameraMode === "instant",
    manual: cameraMode === "pointer",
    setChapter: (next: number, immediate = false) => {
      generation.current += 1;
      elapsed.current = 0;
      setCameraMode(immediate ? "instant" : "pointer");
      setChapter(next);
      if (!playback.playing && !playback.reduced) playback.toggle();
    },
    motion: {
      ...playback,
      replay: () => {
        generation.current += 1;
        elapsed.current = 0;
        setCameraMode("instant");
        setChapter(0);
        playback.replay();
      },
    },
  };
}
export type Narrative = ReturnType<typeof useNarrative>;
