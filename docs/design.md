# Design

How the OxHack '26 app looks, reads and moves. Build the React app (`web/`) against this document. The reference is the throwaway "Figure" prototype, which is kept off `main`. Its rules are captured here.

## Decision

On 2026-10-24 the team chose the **Figure** direction: the app reads like a living figure in a scientific journal. Each step is one figure composition that rearranges itself when the student moves on.

We explored three rounds of alternatives before choosing:

- **Round 1** had playful and themed directions: a lab notebook, a cell voyage, a sticker quest, a network atlas and an assay instrument. They were rejected as too playful and visually noisy for a serious research subject.
- **Round 2** had experimental but serious directions: micrograph, figure, depth, Swiss modernist and energy landscape. Figure was picked.
- **Round 3** fused Figure with round 1's Network atlas (a persistent 3D network, an editorial serif, a blue-grey page) in four variants. It was not adopted. Its findings shaped the revised Figure: larger type, at most three panels per step, and plain wording.

Jessica's concern that Figure was not professional enough is addressed by the revision. The step title is set in a display serif. Body text is at least 15px. There are no more than three panels per step. The dense captions and identifiers are gone.

## Principles

1. **One step, one figure.** A step is a single composition of at most three panels on white paper. There is no chrome beyond the header and the footer link to the evaluation.
2. **Say everything once.** A fact, label, warning or explanation appears in one place per screen. The step name appears only as the page title, and the navigation shows the current step by its state alone. Buttons read "Back" and "Next" and never repeat the next step's name. There are no eyebrows, no "step N of 8" counters and no captions that restate the panels.
3. **Plain words.** Students should never meet a term without its meaning. All interface copy comes from one copy deck (`web/src/copy/en.ts`). Text that depends on the Disease, such as evidence statements and juror objections, comes from the API. Statistics get plain names and a one-line explanation, shown once:

   | Term in the data | Label shown |
   |---|---|
   | Kendall's W | Agreement |
   | Network z-score | Closeness |
   | Vina score | Docking score |
   | Redock RMSD | Redock check |

   Model names come from the Experiment's jury configuration (the API's `display_name`) and are never hard-coded. Database identifiers are not shown, except the disease ID as quiet secondary text in search results.
4. **3D where it explains.** The protein network, the molecule and the binding pose are real WebGL. They are drawn in the same flat, outlined, print-like style as the charts, so they read as part of the figure rather than as decoration.
5. **Honest limits.** Rankings, the jury and poses are hypotheses, and each step says so where it matters (the pose caveat, the jury's agreement note). There is no blanket disclaimer. A missing value is shown as missing; it is never scored as zero and never labelled safe. When a drug has no recorded label warnings, the warning box is left out rather than replaced with a note.

## Tokens

### Colour

| Role | Hex | Use |
|---|---|---|
| Paper | `#ffffff` | Page and panels |
| Ink | `#000000` | Text, axes, primary button, interaction accent |
| Grey 1 | `#4d535a` | Secondary text |
| Grey 2 | `#6f757c` | Tertiary text, inactive navigation |
| Rule | `#e1e4e8` | Dividers, gridlines |
| Disease protein | `#d55e00` | Okabe-Ito vermilion |
| Drug target | `#0072b2` | Okabe-Ito blue |
| Route / path | `#009e73` | Okabe-Ito bluish green |
| Contested / caution | `#e69f00` | Okabe-Ito orange; split jury decisions |
| Redock overlay | `#cc79a7` | Okabe-Ito reddish purple |

The roles use the Okabe-Ito palette, which stays distinguishable for colour-blind readers. Each colour keeps one meaning across every step. Never use a role colour as decoration.

### Type

| Use | Face | Size (at 1440 wide) |
|---|---|---|
| Step title | Source Serif 4, display optical size | 44px |
| Step intro | Source Serif 4 | 18px |
| Body and interface | Instrument Sans | 15-17px |
| Chart labels and axes | Instrument Sans | 13-15px |

Use sentence case everywhere: no all-caps labels, and no arrows appended to buttons. Use tabular figures in charts and tables. Keep lines under 80 characters.

### Space and layout

- **Spacing:** use a 4/8px rhythm.
- **Header:** the product name, then the disease (once), then the step navigation, then Back and Next.
- **Body:** below the header sit the step title and intro, then the figure grid. Panels align to one grid, and a step's grid changes when the step changes.
- **Panel titles:** short and plain ("Ranking", "Agreement"). Use a panel letter only when other text refers to that panel.

## Signature devices

- **Slope chart** (Candidate drugs): network rank on the left joins evidence rank on the right, one line per drug. Closeness sits on the same row, so each drug is named once.
- **Ballot board** (Model jury): one row per drug in consensus order and one column per model, headed by its marker shape. Each tile shows the model's rank and is filled (Investigate), outlined (Watch) or light (Set aside); a split decision is marked once, by a bar in the contested colour at the row's edge. Picking a row opens a reading pane with each model's call, case and objection.
- **Protein network:** one persistent 3D object. Each step highlights only what that step is about: disease proteins, a drug's targets, or the route from a drug to a disease protein.
- **Binding pose** (3Dmol.js, PDB 6WTO, JAK2 with baricitinib; the same structure is the redock control): a thin backbone trace and the ligand in sticks. Controls cover the pocket surface, the redock overlay, spin and reset. The docking score and redock check always carry their caveat.

## Motion

Use one orchestrated transition per step change. Panels that persist move to their new grid position, and new panels hinge up from their bottom edge. The network re-orients to the step's subject. Motion that answers a click is welcome; ambient motion is limited to the slow rotation of 3D objects. Respect `prefers-reduced-motion`: with it on, transitions are instant, but manual rotation still works.

## Not yet designed

The prototype shows only the path where every step succeeds. These states still need designs before or during the build (see `plan.md` section 12):

- **Loading:** progress for each step and the docking queue.
- **Unavailable services:** the Model jury unavailable; docking unavailable.
- **Partial results:** a disease with no mapped targets, and drugs that cannot be scored.
- **Other diseases:** any disease other than the COVID-19 fixture.
- **Small screens:** narrow layouts and touch interaction.
- **Keyboard:** a full keyboard path through every step.
