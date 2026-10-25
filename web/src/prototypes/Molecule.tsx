import { useState } from "react";
import type { Conformer } from "../api/types";
import type { DemoCandidate } from "./data";

const conformerFiles = import.meta.glob<Conformer>(
  "../../../api/oxhack_api/fixtures/conformers/*.json",
  { eager: true, import: "default" },
);
const conformers = new Map(
  Object.values(conformerFiles).map((conformer) => [conformer.pubchem_cid, conformer]),
);

export function Molecule({ candidate }: { candidate: DemoCandidate }) {
  const [angle, setAngle] = useState(25);
  const conformer =
    candidate.pubchem_cid === null ? undefined : conformers.get(candidate.pubchem_cid);
  if (!conformer)
    return (
      <div className="molecule-unavailable">
        <p>A recorded molecular structure is not available for this candidate.</p>
      </div>
    );
  const rad = (angle * Math.PI) / 180;
  const projected = conformer.atoms.map((atom) => ({
    ...atom,
    px: 190 + (atom.x * Math.cos(rad) + atom.z * Math.sin(rad)) * 18,
    py: 112 + (atom.y * 0.85 - (atom.z * Math.cos(rad) - atom.x * Math.sin(rad)) * 0.4) * 18,
  }));
  return (
    <div className="molecule-view">
      <svg
        viewBox="0 0 380 235"
        role="img"
        aria-label={`Recorded molecular structure of ${candidate.displayName}. This is the drug molecule, not a predicted binding pose.`}
      >
        {conformer.bonds.map((bond, index) => {
          const a = projected[bond.a];
          const b = projected[bond.b];
          if (!a || !b || a.element === "H" || b.element === "H") return null;
          return (
            <line
              key={index}
              x1={a.px}
              y1={a.py}
              x2={b.px}
              y2={b.py}
              className="molecule-bond"
              strokeWidth={bond.order > 1 ? 4 : 2.5}
            />
          );
        })}
        {projected.map((atom, index) =>
          atom.element === "H" ? null : (
            <g key={index}>
              <circle
                cx={atom.px}
                cy={atom.py}
                r={atom.element === "C" ? 4 : 8}
                className={`atom atom-${atom.element.toLowerCase()}`}
              />
              {atom.element !== "C" && (
                <text x={atom.px} y={atom.py + 3.5} textAnchor="middle">
                  {atom.element}
                </text>
              )}
            </g>
          ),
        )}
      </svg>
      <div className="molecule-controls">
        <label>
          Rotate molecule
          <input
            aria-label="Rotate molecular structure"
            type="range"
            min="0"
            max="180"
            value={angle}
            onChange={(event) => {
              setAngle(Number(event.target.value));
            }}
          />
        </label>
        <a href={conformer.source_url} target="_blank" rel="noreferrer">
          PubChem structure
        </a>
      </div>
      <p className="molecule-note">
        Drug structure only. Docking is a separate, optional experiment.
      </p>
    </div>
  );
}
