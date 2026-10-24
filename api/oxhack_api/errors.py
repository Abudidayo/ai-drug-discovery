"""Domain errors and their HTTP form: FastAPI's `{"detail": "..."}` body."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .schemas import ErrorResponse, UnprocessableResponse


class ApiError(Exception):
    """An error with a plain-words message meant for the person using the app."""

    status_code = 500

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFound(ApiError):
    status_code = 404


class Conflict(ApiError):
    """The request is valid but the Experiment's current state does not allow it."""

    status_code = 409


class Unprocessable(ApiError):
    """The request is well formed but cannot be carried out, e.g. an unsupported pair."""

    status_code = 422


class Unavailable(ApiError):
    """A data source or backend cannot answer right now."""

    status_code = 503


def install_error_handlers(app: FastAPI) -> None:
    async def handle(_request: Request, exc: Exception) -> JSONResponse:
        assert isinstance(exc, ApiError)
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    app.add_exception_handler(ApiError, handle)


def responses(*codes: int) -> dict[int | str, dict[str, Any]]:
    """OpenAPI descriptions of the error responses a route can return."""
    known: dict[int, dict[str, Any]] = {
        404: {"model": ErrorResponse, "description": "Not found."},
        409: {"model": ErrorResponse, "description": "Not allowed in the current state."},
        422: {"model": UnprocessableResponse, "description": "The request cannot be carried out."},
        503: {"model": ErrorResponse, "description": "A data source is unavailable."},
    }
    return {code: known[code] for code in codes}
