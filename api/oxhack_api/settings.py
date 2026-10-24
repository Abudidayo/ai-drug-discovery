"""App settings, read from `OXHACK_*` environment variables."""

from pathlib import Path
from typing import Literal

from pydantic import Field
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
        default=4, ge=1, description="Threads for in-process background jobs."
    )
