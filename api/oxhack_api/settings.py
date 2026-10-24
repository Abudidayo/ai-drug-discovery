"""App settings, read from `OXHACK_*` environment variables."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

FIXTURES_DIR = Path(__file__).parent / "fixtures"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="OXHACK_", extra="ignore")

    source: Literal["fixture"] = Field(
        default="fixture",
        description="Where Experiment data comes from. Only fixture exists until phase 5.",
    )
    fixtures_dir: Path = Field(
        default=FIXTURES_DIR, description="Folder holding the fixture files."
    )
    fixture_delay_ms: int = Field(
        default=400,
        ge=0,
        description="Pause between fixture job steps, so the UI can show progress. 0 in tests.",
    )
    worker_threads: int = Field(
        default=4, ge=1, description="Threads that run background jobs, in or out of process."
    )

    # Storage ------------------------------------------------------------------

    repo: Literal["memory", "postgres"] = Field(
        default="memory",
        description="memory: lost on restart. postgres: saved in OXHACK_DATABASE_URL.",
    )
    database_url: str | None = Field(
        default=None,
        description="Postgres connection string, used when repo is postgres. Migrate it first.",
    )
    database_pool_size: int = Field(
        default=10, ge=1, description="Most Postgres connections one process opens."
    )

    # The Postgres job queue -----------------------------------------------------

    inprocess_worker: bool = Field(
        default=True,
        description=(
            "With repo postgres, also run the job worker inside the API process. Set 0 when "
            "`python -m oxhack_api.worker` runs separately."
        ),
    )
    worker_poll_ms: int = Field(
        default=1000,
        ge=1,
        description="How often an idle worker looks for jobs it was not notified about.",
    )
    job_heartbeat_s: float = Field(
        default=10, gt=0, description="How often a worker refreshes its running jobs' heartbeat."
    )
    job_stale_after_s: float = Field(
        default=60,
        gt=0,
        description="A running job whose heartbeat is older than this is re-queued.",
    )
    job_max_attempts: int = Field(
        default=3, ge=1, description="Claims of one job before a stale one is failed instead."
    )

    @model_validator(mode="after")
    def _postgres_needs_a_url(self) -> Settings:
        if self.repo == "postgres" and not self.database_url:
            raise ValueError("OXHACK_REPO=postgres needs OXHACK_DATABASE_URL")
        if self.job_heartbeat_s >= self.job_stale_after_s:
            raise ValueError("OXHACK_JOB_HEARTBEAT_S must be shorter than OXHACK_JOB_STALE_AFTER_S")
        return self
