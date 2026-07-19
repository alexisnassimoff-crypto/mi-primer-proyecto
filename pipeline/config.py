"""Configuracion central del pipeline. Lee variables de entorno desde .env.

Nunca commitear .env (esta en .gitignore). Ver docs/SETUP.md.
"""
from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv  # python-dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except Exception:  # dotenv es opcional; en su ausencia se usan las env del sistema
    pass

# --- Rutas ---
ROOT = Path(__file__).resolve().parent.parent
CONTENT_PLAN = ROOT / "content-plan" / "songs.json"
OUTPUT_DIR = ROOT / "output"
STATE_FILE = OUTPUT_DIR / "state.json"

# --- Modo ---
# DRY_RUN=1 (default): no llama a ninguna API, genera manifiestos locales. Sirve para
# probar el flujo completo sin keys ni gastar creditos.
DRY_RUN = os.getenv("DRY_RUN", "1") not in ("0", "false", "False", "")

# --- Claves de API (se cargan de .env) ---
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "")
ATLABS_API_KEY = os.getenv("ATLABS_API_KEY", "")
VOICE_API_KEY = os.getenv("VOICE_API_KEY", "")          # LOVO o ElevenLabs
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET_FILE", "client_secret.json")
YOUTUBE_TOKEN_FILE = os.getenv("YOUTUBE_TOKEN_FILE", "token.json")

# --- Parametros de marca ---
CHANNEL_NAME = "Glimmerwood"
MADE_FOR_KIDS = True          # Obligatorio por COPPA. No cambiar.
DEFAULT_LANGUAGE = "en"

# --- Endpoints (CONFIRMAR contra la doc oficial de cada proveedor antes de produccion) ---
# Se dejan como env para poder ajustarlos sin tocar codigo.
SUNO_BASE_URL = os.getenv("SUNO_BASE_URL", "https://api.suno.ai/v1")
ATLABS_BASE_URL = os.getenv("ATLABS_BASE_URL", "https://api.atlabs.ai/v1")
VOICE_BASE_URL = os.getenv("VOICE_BASE_URL", "https://api.elevenlabs.io/v1")


def ensure_dirs() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def missing_keys() -> list[str]:
    """Devuelve las keys faltantes para produccion (no aplica en dry-run)."""
    missing = []
    if not SUNO_API_KEY:
        missing.append("SUNO_API_KEY")
    if not ATLABS_API_KEY:
        missing.append("ATLABS_API_KEY")
    return missing
