"""Carga y estado del plan de contenido (content-plan/songs.json).

El plan es la fuente de verdad de QUE producir. El estado (output/state.json) lleva el
registro de que ya se produjo/publico, para no repetir.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from . import config


READY_FILE = Path(config.CONTENT_PLAN).parent / "ready.json"


def load_songs() -> list[dict[str, Any]]:
    data = json.loads(config.CONTENT_PLAN.read_text(encoding="utf-8"))
    return data.get("songs", [])


def load_ready_payload(song_id: str) -> dict[str, Any] | None:
    """Payload de produccion (letra, prompts, metadata) para una cancion 'ready'."""
    if not READY_FILE.exists():
        return None
    data = json.loads(READY_FILE.read_text(encoding="utf-8"))
    return data.get(song_id)


def load_state() -> dict[str, Any]:
    if config.STATE_FILE.exists():
        return json.loads(config.STATE_FILE.read_text(encoding="utf-8"))
    return {"produced": {}, "published": []}


def save_state(state: dict[str, Any]) -> None:
    config.ensure_dirs()
    config.STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def next_song(state: dict[str, Any]) -> dict[str, Any] | None:
    """Proxima cancion a producir: primera 'ready' aun no producida."""
    produced = state.get("produced", {})
    for song in load_songs():
        if song.get("status") == "ready" and song["id"] not in produced:
            return song
    return None


def mark_produced(state: dict[str, Any], song_id: str, manifest: dict[str, Any]) -> None:
    state.setdefault("produced", {})[song_id] = manifest
    save_state(state)


def mark_published(state: dict[str, Any], song_id: str, video_id: str) -> None:
    state.setdefault("published", []).append({"song_id": song_id, "video_id": video_id})
    save_state(state)
