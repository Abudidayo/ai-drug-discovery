"""The product rules: what may happen to an Experiment, and when.

- Building is in the background: create returns a queued Experiment at once.
- The Model jury is asked at most once per Experiment, and only when it is ready.
- Jury and docking requests are refused while an Experiment is archived.
- Archiving is refused while the Experiment is building or a docking job is live.
- An identical docking computation is reused instead of run twice.

Each change and the job it needs are made in one `repo.locked()` block, so the
Postgres repo checks the rule, writes the change and queues the job in one
transaction.
"""

from __future__ import annotations

from uuid import UUID, uuid4

from ..errors import Conflict, NotFound, Unavailable, Unprocessable
from ..jobs import JobRef, Runner, pending_jurors, utcnow
from ..repo import AlreadyExists, DockInputs, DuplicateComputation, Repo
from ..schemas import (
    DiseaseSearchResult,
    DockJob,
    DockRequest,
    Experiment,
    ExperimentSummary,
    JuryRun,
)
from .docking import DockingBackend, cache_key, unsupported_reason
from .jury import JuryBackend
from .source import ExperimentSource, SourceError

LIVE_DOCK_STATUSES = ("queued", "running")


class ExperimentService:
    def __init__(
        self,
        repo: Repo,
        source: ExperimentSource,
        jury: JuryBackend,
        docking: DockingBackend,
        runner: Runner,
    ) -> None:
        self.repo = repo
        self.source = source
        self.jury = jury
        self.docking = docking
        self.runner = runner

    # Experiments ------------------------------------------------------------

    def create(self, disease_id: str) -> Experiment:
        try:
            plan = self.source.plan(disease_id)
        except SourceError as exc:
            raise Unavailable(str(exc)) from exc
        if plan is None:
            raise Unprocessable(
                f"There is no data for the Disease {disease_id}. Search for a Disease and "
                "use one of the results."
            )
        experiment = Experiment(
            id=uuid4(),
            status="queued",
            stage=None,
            error=None,
            disease=plan.disease,
            data_releases=plan.data_releases,
            ranking_settings=plan.ranking_settings,
            jury_config=plan.jury_config,
            targets=[],
            network=None,
            candidates=[],
            jury=None,
            dock_jobs=[],
            fixture_note=plan.fixture_note,
            created_at=utcnow(),
            archived_at=None,
        )
        with self.repo.transaction():
            self.repo.add_experiment(experiment)
            self.runner.submit(JobRef("experiment_build", experiment.id))
        return experiment

    def get(self, experiment_id: UUID) -> Experiment:
        experiment = self.repo.get_experiment(experiment_id)
        if experiment is None:
            raise NotFound("There is no saved Experiment with this ID.")
        return experiment

    def search(self, query: str, limit: int) -> list[DiseaseSearchResult]:
        try:
            return self.source.search_diseases(query, limit)
        except SourceError as exc:
            raise Unavailable(str(exc)) from exc

    def history(self, *, archived: bool, include_building: bool) -> list[ExperimentSummary]:
        return self.repo.list_experiments(archived=archived, include_building=include_building)

    def archive(self, experiment_id: UUID) -> Experiment:
        with self.repo.locked(experiment_id):
            experiment = self.get(experiment_id)
            if experiment.status in ("queued", "building"):
                raise Conflict("This Experiment is still being built. Archive it once it is ready.")
            if any(job.status in LIVE_DOCK_STATUSES for job in experiment.dock_jobs):
                raise Conflict(
                    "A binding pose is still being computed for this Experiment. Archive it "
                    "once the docking job has finished."
                )
            if experiment.archived_at is None:
                self.repo.set_archived_at(experiment_id, utcnow())
            return self.get(experiment_id)

    def restore(self, experiment_id: UUID) -> Experiment:
        with self.repo.locked(experiment_id):
            experiment = self.get(experiment_id)
            if experiment.archived_at is not None:
                self.repo.set_archived_at(experiment_id, None)
            return self.get(experiment_id)

    def _require_active_and_ready(self, experiment: Experiment, action: str) -> None:
        if experiment.archived_at is not None:
            raise Conflict(f"This Experiment is archived. Restore it to {action}.")
        if experiment.status == "failed":
            raise Conflict(f"This Experiment failed to build, so you cannot {action}.")
        if experiment.status != "ready":
            raise Conflict(
                f"This Experiment is still being built. Wait until it is ready to {action}."
            )

    # Model jury -------------------------------------------------------------

    def ask_jury(self, experiment_id: UUID) -> JuryRun:
        with self.repo.locked(experiment_id):
            experiment = self.get(experiment_id)
            self._require_active_and_ready(experiment, "ask the Model jury")
            models = experiment.jury_config.models
            run = JuryRun(
                status="queued",
                models=models,
                jurors=pending_jurors(models),
                votes=[],
                consensus=None,
                agreement=None,
                contested=[],
                error=None,
                created_at=utcnow(),
                started_at=None,
                finished_at=None,
            )
            try:
                self.repo.add_jury_run(experiment_id, run)
                self.runner.submit(JobRef("jury_run", experiment_id))
            except AlreadyExists:
                raise Conflict(
                    "The Model jury has already reviewed this Experiment. Each Experiment has "
                    "one jury review."
                ) from None
        return run

    # Docking ----------------------------------------------------------------

    def request_dock(self, request: DockRequest) -> DockJob:
        with self.repo.locked(request.experiment_id):
            experiment = self.get(request.experiment_id)
            self._require_active_and_ready(experiment, "compute a binding pose")
            candidate = next(
                (c for c in experiment.candidates if c.candidate_id == request.candidate_id), None
            )
            if candidate is None:
                raise Unprocessable(
                    f"{request.candidate_id} is not on this Experiment's shortlist."
                )
            structure = self.docking.structure(request.structure_id)
            if structure is None:
                raise Unprocessable(
                    f"{request.structure_id} is not one of the prepared structures."
                )
            smiles = self.docking.ligand_smiles(candidate.candidate_id)
            reason = unsupported_reason(candidate, structure, smiles)
            if reason is not None:
                raise Unprocessable(reason)
            assert smiles is not None  # unsupported_reason refuses a drug without SMILES
            settings = self.docking.settings_for(structure)
            inputs = DockInputs(cache_key(structure, smiles, settings), smiles)
            job = DockJob(
                id=uuid4(),
                kind="candidate",
                status="queued",
                experiment_id=experiment.id,
                candidate_id=candidate.candidate_id,
                target_id=structure.target_id,
                structure_id=structure.id,
                settings=settings,
                scores=None,
                files=None,
                control_rmsd=None,
                error=None,
                cached_from=None,
                fixture=self.docking.fixture,
                created_at=utcnow(),
                started_at=None,
                finished_at=None,
            )
            reused = self.repo.find_reusable_dock_job(inputs.cache_key)
            if reused is None:
                try:
                    self.repo.add_dock_job(job, inputs)
                    self.runner.submit(JobRef("dock", job.id))
                    return job
                except DuplicateComputation:
                    # Another request started the same computation since we looked.
                    reused = self.repo.find_reusable_dock_job(inputs.cache_key)
                    if reused is None:
                        raise
            # Identical inputs: reuse the result (or the live run) instead of docking again.
            job = job.model_copy(
                update={
                    "status": reused.status,
                    "scores": reused.scores,
                    "files": reused.files,
                    "fixture": reused.fixture,
                    "cached_from": reused.id,
                    "started_at": reused.started_at,
                    "finished_at": job.created_at if reused.status == "done" else None,
                }
            )
            self.repo.add_dock_job(job, inputs)
        return job

    def get_dock_job(self, job_id: UUID) -> DockJob:
        job = self.repo.get_dock_job(job_id)
        if job is None:
            raise NotFound("There is no docking job with this ID.")
        return job
