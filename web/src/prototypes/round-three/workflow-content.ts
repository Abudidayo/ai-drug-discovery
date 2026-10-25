export const storyImages = [
  new URL(
    "../../../prototypes/workflow-review/assets/story-1-navigation-clean.png",
    import.meta.url,
  ).href,
  new URL(
    "../../../prototypes/workflow-review/assets/story-2-navigation-clean.png",
    import.meta.url,
  ).href,
  new URL(
    "../../../prototypes/workflow-review/assets/story-3-navigation-clean.png",
    import.meta.url,
  ).href,
];
export const technicalOverviewImage = new URL(
  "../../../prototypes/workflow-review/diagrams/complete-workflow-v2.svg",
  import.meta.url,
).href;
export const workflowStages = [
  {
    title: "How do we connect drugs to diseases?",
    description:
      "Join disease-linked proteins to drug targets by stable gene ID. Examine direct overlap, network relevance and shared biological pathways.",
    note: "These are associations. The jury separately asks whether the drug’s action is supported, contradicted or unknown for the disease.",
    art: 1,
    story:
      "Start with a disease. Bring together the proteins linked to it and the existing medicines that act on relevant proteins.",
  },
  {
    title: "Two evidence routes. One shortlist.",
    description:
      "10 places from physical-network Random Walk with Restart, plus 5 from direct disease–target evidence.",
    note: "RWR default: p(next) = 0.7 Pᵀp + 0.3 p₀ · Drug score = mean stationary mass at mapped drug targets · Deduplicate + refill",
    art: 2,
    story:
      "Follow the connections through the cell. Look for existing medicines that act on proteins relevant to the disease.",
  },
  {
    title: "Every claim has an evidence trail.",
    description:
      "Source records become candidate-bound statements with E-IDs, numeric values and provenance. TigerData preserves the evidence for review and inspection.",
    note: "Mechanism descriptions retain source wording. Other statements are built from structured fields. Every item keeps its source ID, URL and pinned release.",
    art: 3,
    story:
      "Keep the original evidence beside every candidate. Follow a model’s explanation back to the exact statements it cited.",
  },
  {
    title: "Three models challenge the same evidence.",
    description:
      "Independent critiques through Snowflake Cortex. Every model checks rationale, contradictions, safety and missing evidence.",
    note: "jury-v7 · Schema + citation + numeric validation · Borda consensus · Kendall’s W · Disagreements stay visible",
    art: 3,
    story:
      "Three independent AI reviews examine the same evidence. Supporting clues, objections and disagreements stay visible.",
  },
  {
    title: "TigerData keeps the whole research trail.",
    description:
      "Tiger Cloud PostgreSQL stores experiments, candidate evidence, exact jury reviews and docking metadata so researchers can reopen, compare and archive their work.",
    note: "Large graph and pose files stay in file storage. PostgreSQL keeps their references and hashes. Optional docking remains separate from ranking.",
    art: 3,
    story:
      "Researchers receive a shortlist with sources and open questions. They decide what deserves further testing.",
  },
];

export const dockingImage = new URL(
  "../../../prototypes/workflow-review/diagrams/stage-4.svg",
  import.meta.url,
).href;
export const provenanceUrl = new URL(
  "../../../prototypes/workflow-review/provenance.md",
  import.meta.url,
).href;
