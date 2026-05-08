from __future__ import annotations

import logging
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    status_code = 500
    code = "internal_error"

    def __init__(self, message: str, *, details: dict[str, Any] | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


class BadRequestError(AppError):
    status_code = 400
    code = "bad_request"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class UnsupportedSlideError(AppError):
    status_code = 422
    code = "unsupported_slide"


class RegionTooLargeError(AppError):
    status_code = 413
    code = "region_too_large"


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}},
    )


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    logger.info("Request validation error: %s", exc)
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": "The request payload is invalid.", "details": {"errors": exc.errors()}}},
    )


def handle_error_or_log_with_messages(err: Exception | None, err_msg: str, success_msg: str) -> None:
    if err is not None:
        logger.error("%s: %s", err_msg, err)
        return
    logger.info(success_msg)
