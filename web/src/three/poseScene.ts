import {
  createViewer,
  SurfaceType,
  type AtomSelectionSpec,
  type AtomSpec,
  type GLModel,
  type GLViewer,
} from "3dmol";
import { Matrix4, Quaternion, Vector3 } from "three";
import { tokenColor } from "./plate";

/**
 * A binding pose drawn with 3Dmol.js in the figure's print style (docs/design.md, "Binding
 * pose"): the protein as a thin backbone trace with ink outlines, the drug in sticks, the pocket's
 * residues as fine grey sticks. Optional: a translucent surface over the pocket and the drug's
 * crystal position, in the redock colour, to compare with the pose.
 */

/** Residues with an atom this close to the drug (Å) are drawn as sticks. */
const POCKET_ANGSTROM = 4.5;
/** Protein atoms this close to the drug (Å) carry the pocket surface. */
const SURFACE_ANGSTROM = 6;
/** Spin speed in degrees a second. */
const SPIN_DEGREES = 10;
/** How far the camera pulls back from the drug, so the pocket around it shows. */
const ZOOM_OUT = 0.7;
/** Degrees the opening view tips the drug back from face-on, so it still reads as 3D. */
const TILT = 24;
/** How deep (Å) and how wide around the drug to look for protein in the way of the view. */
const FRONT_DEPTH = 16;
const FRONT_RADIUS = 7;

export interface PoseFiles {
  /** receptor.pdb: the protein chain the drug was docked into. */
  receptor: string;
  /** poses.sdf: the poses, best first. */
  poses: string;
  /** crystal_ligand.sdf: the co-crystal ligand in its crystal position. */
  crystal: string;
}

/** The first molecule of an SDF file: the best pose. */
export function firstMolecule(sdf: string): string {
  const end = sdf.indexOf("$$$$");
  return end === -1 ? sdf : `${sdf.slice(0, end + 4)}\n`;
}

/** Whether a point lies within `distance` of any of `atoms`. */
function near(atoms: readonly AtomSpec[], distance: number) {
  const limit = distance * distance;
  return (atom: AtomSpec) =>
    atoms.some((other) => {
      const dx = (atom.x ?? 0) - (other.x ?? 0);
      const dy = (atom.y ?? 0) - (other.y ?? 0);
      const dz = (atom.z ?? 0) - (other.z ?? 0);
      return dx * dx + dy * dy + dz * dz <= limit;
    });
}

/** The dominant direction of `points` around their centre (power iteration on the covariance). */
function principalAxis(points: readonly Vector3[], without?: Vector3): Vector3 {
  const centre = new Vector3();
  for (const point of points) centre.add(point);
  centre.divideScalar(Math.max(1, points.length));
  const spread = points.map((point) => {
    const offset = point.clone().sub(centre);
    // Leave out a direction already found, to get the next one.
    if (without) offset.addScaledVector(without, -offset.dot(without));
    return offset;
  });
  let axis = new Vector3(1, 0.7, 0.4).normalize();
  for (let step = 0; step < 32; step++) {
    const next = new Vector3();
    for (const offset of spread) next.addScaledVector(offset, offset.dot(axis));
    if (next.lengthSq() < 1e-12) break;
    axis = next.normalize();
  }
  return axis;
}

const toPoint = (atom: AtomSpec) => new Vector3(atom.x ?? 0, atom.y ?? 0, atom.z ?? 0);

/**
 * The rotation that shows a drug face-on: its longest extent across the screen, its second
 * across too, and its thinnest towards the reader, so a flat drug is seen flat and not edge-on.
 * Of the two face-on sides, it looks in from the one with less protein in the way.
 */
export function faceOn(drugAtoms: readonly AtomSpec[], proteinAtoms: readonly AtomSpec[]) {
  const points = drugAtoms.map(toPoint);
  if (points.length < 3) return new Quaternion();
  const centre = new Vector3();
  for (const point of points) centre.add(point);
  centre.divideScalar(points.length);
  const long = principalAxis(points);
  const wide = principalAxis(points, long);
  const thin = new Vector3().crossVectors(long, wide).normalize();
  // Protein atoms between the drug and the reader, within a column as wide as the pocket.
  let inFront = 0;
  for (const atom of proteinAtoms) {
    const offset = toPoint(atom).sub(centre);
    const depth = offset.dot(thin);
    if (Math.abs(depth) > FRONT_DEPTH) continue;
    const across = offset.addScaledVector(thin, -depth).length();
    if (across < FRONT_RADIUS) inFront += Math.sign(depth);
  }
  if (inFront > 0) {
    wide.negate();
    thin.negate();
  }
  // Rows long, wide and thin: the rotation that takes each onto the screen's x, y and z.
  const basis = new Matrix4().makeBasis(long, wide, thin).transpose();
  return new Quaternion().setFromRotationMatrix(basis);
}

/** 3Dmol keeps these observers private and never disconnects them; dispose does. */
interface ViewerInternals {
  divwatcher?: { disconnect(): void };
  intwatcher?: { disconnect(): void };
}

export class PoseScene {
  private readonly holder: HTMLElement;
  private readonly viewer: GLViewer;
  private readonly receptor: GLModel;
  private readonly ligand: GLModel;
  private readonly crystal: string;
  private readonly pocket: AtomSelectionSpec;
  private readonly home: number[];
  private surface: Promise<number> | null = null;
  private overlay: GLModel | null = null;
  private spinFrame = 0;
  private disposed = false;

  /** Draws `files` into a new layer inside `host`, or returns null when 3Dmol can't start. */
  static create(host: HTMLElement, layerClass: string, files: PoseFiles): PoseScene | null {
    const holder = document.createElement("div");
    holder.className = layerClass;
    host.prepend(holder);
    let viewer: GLViewer | null;
    try {
      viewer = createViewer(holder, { backgroundColor: "white", antialias: true });
    } catch {
      viewer = null;
    }
    if (viewer === null) {
      holder.remove();
      return null;
    }
    return new PoseScene(holder, viewer, files);
  }

  private constructor(holder: HTMLElement, viewer: GLViewer, files: PoseFiles) {
    this.holder = holder;
    this.viewer = viewer;
    this.crystal = files.crystal;

    const ink = tokenColor("--color-ink");
    const halogen = tokenColor("--color-element-halogen");
    const elements = {
      C: ink,
      N: tokenColor("--color-element-n"),
      O: tokenColor("--color-element-o"),
      S: tokenColor("--color-element-s"),
      F: halogen,
      Cl: halogen,
      Br: halogen,
      I: halogen,
    };

    this.receptor = viewer.addModel(files.receptor, "pdb");
    this.ligand = viewer.addModel(firstMolecule(files.poses), "sdf");
    const drug = this.ligand.selectedAtoms({});
    const pocketAtoms = this.receptor.selectedAtoms({ predicate: near(drug, POCKET_ANGSTROM) });
    const residue = (atom: AtomSpec) => `${atom.chain ?? ""}:${String(atom.resi)}`;
    const residues = new Set(pocketAtoms.map(residue));
    this.pocket = { model: this.receptor, predicate: (atom) => residues.has(residue(atom)) };

    // A thin trace, not a ribbon: omitting `style` would draw a full cartoon.
    const backbone = {
      cartoon: { style: "trace", color: tokenColor("--color-backbone"), thickness: 0.14 },
    };
    this.receptor.setStyle({}, backbone);
    viewer.setStyle(this.pocket, {
      ...backbone,
      stick: { radius: 0.07, color: tokenColor("--color-edge") },
    });
    this.ligand.setStyle(
      {},
      {
        stick: { radius: 0.24, colorscheme: { prop: "elem", map: elements } },
        sphere: { scale: 0.2, colorscheme: { prop: "elem", map: elements } },
      },
    );
    viewer.setViewStyle({ style: "outline", color: ink, width: 0.02 });

    viewer.zoomTo({ model: this.ligand });
    const turn = faceOn(drug, this.receptor.selectedAtoms({}));
    const fitted = viewer.getView() as number[];
    viewer.setView([...fitted.slice(0, 4), turn.x, turn.y, turn.z, turn.w]);
    viewer.rotate(TILT, "x");
    viewer.zoom(ZOOM_OUT);
    this.home = viewer.getView() as number[];
    viewer.render();
  }

  /**
   * Shows or hides the translucent surface over the pocket. 3Dmol computes a surface in the
   * background and hands back a promise of its ID, so hiding waits for it before removing it.
   * Resolves once the change is drawn.
   */
  async setSurface(on: boolean): Promise<void> {
    if (on && this.surface === null) {
      const drug = this.ligand.selectedAtoms({});
      // 3Dmol 2.x returns a promise of the surface ID, typed as any.
      this.surface = Promise.resolve(
        this.viewer.addSurface(
          SurfaceType.VDW,
          { opacity: 0.3, color: tokenColor("--color-node") },
          { model: this.receptor, predicate: near(drug, SURFACE_ANGSTROM) },
          { model: this.receptor },
        ) as Promise<number> | number,
      );
      await this.surface;
    } else if (!on && this.surface !== null) {
      const pending = this.surface;
      this.surface = null;
      const id = await pending;
      if (this.disposed) return;
      this.viewer.removeSurface(id);
    } else {
      await this.surface;
    }
    if (!this.disposed) this.viewer.render();
  }

  /** Draws the crystal ligand over the pose, as fatter translucent sticks in the redock colour. */
  setOverlay(on: boolean): void {
    if (on && this.overlay === null) {
      this.overlay = this.viewer.addModel(firstMolecule(this.crystal), "sdf");
      this.overlay.setStyle(
        {},
        { stick: { radius: 0.62, color: tokenColor("--color-redock"), opacity: 0.45 } },
      );
    } else if (!on && this.overlay !== null) {
      this.viewer.removeModel(this.overlay);
      this.overlay = null;
    }
    this.viewer.render();
  }

  /**
   * Turns the slow spin on or off. It turns once per animation frame rather than on 3Dmol's own
   * 25 ms timer, so a slow device draws fewer frames instead of falling behind, and it rests
   * while the page is hidden or the view has no size.
   */
  setSpin(on: boolean): void {
    cancelAnimationFrame(this.spinFrame);
    this.spinFrame = 0;
    if (!on || this.disposed) return;
    let last = performance.now();
    const turn = (now: number) => {
      this.spinFrame = requestAnimationFrame(turn);
      const seconds = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (document.hidden || this.holder.clientWidth === 0) return;
      this.viewer.rotate(SPIN_DEGREES * seconds, "y");
    };
    this.spinFrame = requestAnimationFrame(turn);
  }

  /** Back to the opening view: centred on the drug, the pocket around it. */
  reset(): void {
    this.viewer.setView(this.home);
    this.viewer.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.setSpin(false);
    const internals = this.viewer as unknown as ViewerInternals;
    internals.divwatcher?.disconnect();
    internals.intwatcher?.disconnect();
    this.viewer.clear();
    // Free the WebGL context now rather than whenever the browser gets round to it. 3Dmol 2.5
    // draws every viewer through one shared offscreen context (its canvas only shows the
    // result), and makes a fresh one for the next viewer once this one is lost.
    const gl = this.viewer.getRenderer().getContext() as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    // Detached, the viewer measures 0 × 0 and never tries to restore its lost context.
    this.holder.remove();
  }
}
