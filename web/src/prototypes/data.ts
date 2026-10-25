import experimentFile from "../../../api/oxhack_api/fixtures/MONDO_0100096/experiment.json";
import juryFile from "../../../api/oxhack_api/fixtures/MONDO_0100096/jury.json";
import type { Experiment, JuryRun } from "../api/types";

const experiment = experimentFile as unknown as Pick<
  Experiment,
  "disease" | "candidates" | "targets" | "jury_config"
>;
const jury = juryFile as unknown as Pick<JuryRun, "votes" | "consensus">;

export const disease = experiment.disease;
export const diseaseTargets = experiment.targets;
export const candidates = experiment.candidates.map((candidate) => ({
  ...candidate,
  displayName: candidate.name.charAt(0) + candidate.name.slice(1).toLowerCase(),
  juryRank:
    jury.consensus?.ranking.find((rank) => rank.candidate_id === candidate.candidate_id)?.rank ??
    null,
  votes: jury.votes.filter((vote) => vote.candidate_id === candidate.candidate_id),
}));
export type DemoCandidate = (typeof candidates)[number];
export const reviewers = experiment.jury_config.models;
const firstCandidate = candidates[0];
if (!firstCandidate) throw new Error("The recorded example has no candidates");
export const initialCandidate = firstCandidate;
export const demoNotice = "Layout demonstration · Sample ranks and AI reviews are fictional";
export const researchNotice =
  "Research hypotheses, not treatment recommendations. Evidence and safety need further investigation.";

export const workflowSteps = [
  {
    title: "Map the disease",
    short: "Disease biology",
    question: "Which proteins are involved?",
    body: "Start with a disease. Bring together the proteins linked to it and see how they connect inside the cell.",
    output: "A map of the disease’s biology",
    source: "Open Targets + STRING",
  },
  {
    title: "Find existing drugs",
    short: "Drug candidates",
    question: "Which medicines act nearby?",
    body: "Combine 10 candidates prioritised by Random Walk with Restart on the protein network with 5 prioritised by direct disease–target evidence.",
    output: "Up to 15 unique candidates, from two evidence routes",
    source: "Physical STRING network + Open Targets evidence",
  },
  {
    title: "Challenge the evidence",
    short: "Independent review",
    question: "Does the evidence hold up?",
    body: "AI reviewers independently inspect the same evidence without seeing the network ranking. They surface disagreements, missing evidence and safety concerns.",
    output: "Cited reasons, objections and open questions",
    source: "Three independent models through Snowflake Cortex",
  },
  {
    title: "Choose what to investigate",
    short: "Research shortlist",
    question: "What should a researcher test next?",
    body: "Compare candidates, read their sources and explore a possible binding pose. Take a traceable research question into the next experiment.",
    output: "An inspectable starting point for lab work",
    source: "Evidence + comparison + binding poses",
  },
] as const;

export const tabs = [
  { id: "why", label: "Why it matters" },
  { id: "workflow", label: "How it works" },
  { id: "results", label: "Results" },
] as const;
export type TabId = (typeof tabs)[number]["id"];

export function exportCandidates(rows: readonly DemoCandidate[]) {
  const escape = (value: string | number | null) =>
    `"${String(value ?? "Not available").replaceAll('"', '""')}"`;
  const lines = [
    ["Demo data: fictional ranks and scores. Research hypotheses only."],
    [
      "Candidate",
      "Targets",
      "Network rank",
      "Evidence rank",
      "Jury rank",
      "Safety",
      "Known reference",
    ],
    ...rows.map((candidate) => [
      candidate.displayName,
      candidate.targets.map((target) => target.name).join("; "),
      candidate.network?.rank ?? null,
      candidate.direct_evidence_rank,
      candidate.juryRank,
      candidate.safety_status === "warnings_recorded" ? "Warnings recorded" : "Not evaluated",
      candidate.known_answer ? "Yes" : "No",
    ]),
  ];
  const blob = new Blob([lines.map((line) => line.map(escape).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "drug-explorer-demo-shortlist.csv";
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
