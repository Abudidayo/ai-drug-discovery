export function MethodNotes() {
  return (
    <details className="method-notes">
      <summary>The science behind the workflow</summary>
      <div className="method-notes-body">
        <section>
          <h3>Two routes into the shortlist</h3>
          <p>
            The application combines 10 candidates prioritised by Random Walk with Restart on a
            physical STRING protein-interaction graph with 5 prioritised by direct disease–target
            evidence. Overlaps are deduplicated and refilled. Missing coverage stays explicit.
          </p>
        </section>
        <section>
          <h3>Connections you can inspect</h3>
          <p>
            Reconstructed protein paths explain shortest-path proximity. They are not a direct
            explanation of RWR diffusion or proof of a therapeutic mechanism. The original proximity
            and degree-matched rankings remain available for comparison.
          </p>
        </section>
        <section>
          <h3>Critique alongside the ranking</h3>
          <p>
            Three distinct AI models, accessed through Snowflake Cortex, independently review
            mechanisms, pathway context, contradictory evidence, safety concerns and research gaps.
            Their assessments remain separate from the computational ranking.
          </p>
        </section>
        <section>
          <h3>An optional structural experiment</h3>
          <p>
            For supported drug–protein pairs, Docker-based molecular preparation and AutoDock Vina
            use experimental RCSB PDB structures to generate predicted binding poses. A pose is a
            geometric hypothesis; docking does not determine the candidate ranking.
          </p>
        </section>
        <section>
          <h3>Reproducible research, visible limits</h3>
          <p>
            Saved experiments retain sources, data versions and settings. The framework adapts
            established methods; the contribution is connecting, implementing and testing them in a
            transparent workflow. Retrospective comparisons have not established consistent ranking
            superiority.
          </p>
        </section>
        <a
          className="method-source"
          href="https://github.com/Abudidayo/ai-drug-discovery/blob/main/ranking/SHORTLIST_HANDOFF.md"
          target="_blank"
          rel="noreferrer"
        >
          Read the ranking and selection handoff
        </a>
      </div>
    </details>
  );
}
