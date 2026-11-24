"""One error shape for every response: {"error": {"code", "message", "details"}} (rules.md §8)."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Raise this instead of HTTPException so every error has a stable code."""

    def __init__(
        self,
        code: str,
        message: str,
        status: int = 400,
        details: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.details = details or {}
        self.headers = headers or {}


def _body(code: str, message: str, details: dict[str, Any]) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details}}


def install_error_handlers(app: FastAPI) -> None:
    """Register AppError and request-validation handlers, both in the one error shape."""

    async def handle(_request: Request, exc: Exception) -> JSONResponse:
        assert isinstance(exc, AppError)
        return JSONResponse(
            status_code=exc.status, content=_body(exc.code, exc.message, exc.details), headers=exc.headers
        )

    async def handle_validation(_request: Request, exc: Exception) -> JSONResponse:
        assert isinstance(exc, RequestValidationError)
        # Field paths and reasons only: never echo the submitted values (they may hold personal data).
        fields = [
            {"field": ".".join(str(p) for p in e.get("loc", ())[1:]), "reason": e.get("type", "invalid")}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content=_body("VALIDATION_ERROR", "Check the highlighted fields.", {"fields": fields}),
        )

    app.add_exception_handler(AppError, handle)
    app.add_exception_handler(RequestValidationError, handle_validation)
