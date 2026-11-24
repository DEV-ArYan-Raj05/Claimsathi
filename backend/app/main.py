"""Create the app and mount feature routers — nothing else lives here (rules.md §3.3)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import install_error_handlers
from app.core.logging import setup_logging
from app.features import chat, whatsapp

setup_logging()
settings = get_settings()

app = FastAPI(title="ClaimSathi API", version="0.1.0", docs_url=None if settings.is_production else "/docs")
install_error_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in settings.cors_origins.split(",") if o],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Retry-After"],
)

# Webhooks sit outside /api/v1 and are signature-verified instead of JWT-authenticated.
app.include_router(whatsapp.router)
app.include_router(chat.router)
# TODO(PRD §6.2): mount /api/v1 feature routers (policies, claims, documents, tracker, …) as their
# repositories land. mock_insurer must only be included when not settings.is_production.


@app.get("/healthz", include_in_schema=False)
def healthz() -> dict[str, str]:
    """Liveness probe for Docker / Render."""
    return {"status": "ok"}
