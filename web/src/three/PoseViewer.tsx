import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { dockFileQuery } from "../api/queries";
import type { DockFiles } from "../api/types";
import { copy } from "../copy/en";
import styles from "./PoseViewer.module.css";
import { PoseScene } from "./poseScene";
import { canUseWebGL } from "./webgl";

interface PoseViewerProps {
  files: DockFiles;
  /** Accessible name of the 3D view: which drug in which protein. */
  label: string;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToMotion, () => window.matchMedia(REDUCED_MOTION).matches);
}

interface ToggleProps {
  pressed: boolean;
  onToggle: () => void;
  /** The overlay's toggle carries its colour, so it is its own legend. */
  swatch?: "overlay";
  children: ReactNode;
}

function Toggle({ pressed, onToggle, swatch, children }: ToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={pressed}
      data-swatch={swatch}
      onClick={onToggle}
    >
      <span className={styles.box} aria-hidden="true" />
      {children}
    </button>
  );
}

/**
 * A docking result in 3D (3Dmol.js): the protein's backbone, the pocket and the drug's pose. Four
 * controls sit above the view, never over it: the pocket surface, the drug's crystal position,
 * spin and reset. Spin starts on unless the reader asks for reduced motion. The viewer and its
 * WebGL context are released on unmount.
 */
export function PoseViewer({ files, label }: PoseViewerProps) {
  const [receptor, poses, crystal] = useQueries({
    queries: [
      dockFileQuery(files.receptor),
      dockFileQuery(files.poses),
      dockFileQuery(files.crystal_ligand),
    ],
  });
  const reduced = useReducedMotion();
  const [surface, setSurface] = useState(true);
  const [overlay, setOverlay] = useState(false);
  // No choice yet: spin unless motion is reduced. A click is the reader's own choice.
  const [spinChoice, setSpinChoice] = useState<boolean | null>(null);
  const spin = spinChoice ?? !reduced;

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PoseScene | null>(null);
  // The controls' latest values, for a scene that is built after they changed.
  const controlsRef = useRef({ surface, overlay, spin });
  const webgl = canUseWebGL();

  const texts =
    receptor.data !== undefined && poses.data !== undefined && crystal.data !== undefined
      ? { receptor: receptor.data, poses: poses.data, crystal: crystal.data }
      : null;
  const receptorText = texts?.receptor;
  const posesText = texts?.poses;
  const crystalText = texts?.crystal;

  useEffect(() => {
    const host = hostRef.current;
    if (!webgl || !host || receptorText === undefined || posesText === undefined) return;
    if (crystalText === undefined) return;
    const scene = PoseScene.create(host, styles.layer ?? "", {
      receptor: receptorText,
      poses: posesText,
      crystal: crystalText,
    });
    if (scene === null) return;
    sceneRef.current = scene;
    host.dataset.ready = "true";
    const controls = controlsRef.current;
    showSurface(host, scene, controls.surface);
    scene.setOverlay(controls.overlay);
    scene.setSpin(controls.spin);
    return () => {
      scene.dispose();
      sceneRef.current = null;
      delete host.dataset.ready;
      delete host.dataset.surface;
    };
  }, [webgl, receptorText, posesText, crystalText]);

  useEffect(() => {
    controlsRef.current.surface = surface;
    const host = hostRef.current;
    const scene = sceneRef.current;
    if (host && scene) showSurface(host, scene, surface);
  }, [surface]);

  useEffect(() => {
    controlsRef.current.overlay = overlay;
    sceneRef.current?.setOverlay(overlay);
  }, [overlay]);

  useEffect(() => {
    controlsRef.current.spin = spin;
    sceneRef.current?.setSpin(spin);
  }, [spin]);

  const failed = [receptor, poses, crystal].filter((query) => query.isError);
  let note: ReactNode = null;
  if (!webgl) {
    note = copy.network.unavailable;
  } else if (failed.length > 0) {
    note = (
      <>
        <span>{copy.pose.filesFailed}</span>
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            for (const query of failed) void query.refetch();
          }}
        >
          {copy.retry}
        </button>
      </>
    );
  } else if (texts === null) {
    note = copy.pose.loading;
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <Toggle
          pressed={surface}
          onToggle={() => {
            setSurface(!surface);
          }}
        >
          {copy.pose.controls.surface}
        </Toggle>
        <Toggle
          pressed={overlay}
          swatch="overlay"
          onToggle={() => {
            setOverlay(!overlay);
          }}
        >
          {copy.pose.controls.overlay}
        </Toggle>
        <Toggle
          pressed={spin}
          onToggle={() => {
            setSpinChoice(!spin);
          }}
        >
          {copy.pose.controls.spin}
        </Toggle>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            sceneRef.current?.reset();
          }}
        >
          {copy.pose.controls.reset}
        </button>
      </div>
      <div className={styles.stage}>
        <div ref={hostRef} className={styles.plate} role="img" aria-label={label} />
        {note !== null && <p className={styles.note}>{note}</p>}
      </div>
      <ul className={styles.legend}>
        <li>
          <span className={styles.swatch} data-key="protein" aria-hidden="true" />
          {copy.pose.legend.protein}
        </li>
        <li>
          <span className={styles.swatch} data-key="drug" aria-hidden="true" />
          {copy.pose.legend.drug}
        </li>
      </ul>
    </div>
  );
}

/** Applies the surface toggle and marks on the host when it is drawn or gone. */
function showSurface(host: HTMLElement, scene: PoseScene, on: boolean) {
  host.dataset.surface = on ? "computing" : "removing";
  void scene.setSurface(on).then(() => {
    // A later toggle may have changed it again; only the latest request marks the host.
    if (host.dataset.surface === (on ? "computing" : "removing")) {
      host.dataset.surface = on ? "on" : "off";
    }
  });
}
