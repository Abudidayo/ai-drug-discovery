import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => {
    media.removeEventListener("change", callback);
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
}

function subscribeToVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => {
    document.removeEventListener("visibilitychange", callback);
  };
}

export function useIllustrationPlayback() {
  const reduced = useReducedMotion();
  const visible = useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  );
  const [enabled, setEnabled] = useState(true);
  return {
    playing: enabled && visible && !reduced,
    reduced,
    toggle: () => {
      setEnabled((value) => !value);
    },
  };
}

export type IllustrationPlayback = ReturnType<typeof useIllustrationPlayback>;

export function useTour() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setTimeout(() => {
      if (step >= 3) setPlaying(false);
      else setStep(step + 1);
    }, 3600);
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [playing, reduced, step, cycle]);
  return {
    step,
    playing: playing && !reduced,
    selectStep: (next: number) => {
      setStep(next);
      setPlaying(false);
    },
    toggle: () => {
      if (reduced) {
        setStep((step + 1) % 4);
        return;
      }
      if (step === 3 && !playing) setStep(0);
      setPlaying(!playing);
    },
    start: () => {
      setCycle((value) => value + 1);
      setStep(0);
      setPlaying(!reduced);
    },
    pause: () => {
      setPlaying(false);
    },
  };
}

export type Tour = ReturnType<typeof useTour>;
export const delay = (index: number): CSSProperties => ({
  animationDelay: `${String(Math.min(index, 5) * 45)}ms`,
});
