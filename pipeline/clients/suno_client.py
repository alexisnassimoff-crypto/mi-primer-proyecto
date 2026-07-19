"""Cliente de Suno — genera la cancion original a partir del prompt.

DRY_RUN: devuelve una ruta stub sin llamar a la API.
Real: crea el job, poolea hasta completar y descarga el mp3.

NOTA: confirmar endpoints/campos exactos contra la doc oficial de Suno (o el proveedor de
API de Suno que uses). Los nombres aca son un patron REST tipico y estan centralizados
para ajustarlos facil.
"""
from __future__ import annotations

import time
from pathlib import Path

from .. import config


def generate_song(song_id: str, title: str, suno_prompt: str, lyrics: str) -> Path:
    out = config.OUTPUT_DIR / song_id
    out.mkdir(parents=True, exist_ok=True)
    mp3_path = out / f"{song_id}_song.mp3"

    if config.DRY_RUN:
        mp3_path.write_text(f"[DRY_RUN stub] Suno song for {title}\nprompt: {suno_prompt}\n", encoding="utf-8")
        print(f"  [suno] (dry-run) cancion simulada -> {mp3_path.name}")
        return mp3_path

    import requests

    headers = {"Authorization": f"Bearer {config.SUNO_API_KEY}"}
    payload = {"prompt": suno_prompt, "lyrics": lyrics, "title": title, "make_instrumental": False}
    resp = requests.post(f"{config.SUNO_BASE_URL}/generate", json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    job_id = resp.json()["id"]

    audio_url = _poll(job_id, headers)
    audio = requests.get(audio_url, timeout=120)
    audio.raise_for_status()
    mp3_path.write_bytes(audio.content)
    print(f"  [suno] cancion lista -> {mp3_path.name}")
    return mp3_path


def _poll(job_id: str, headers: dict, max_wait: int = 600) -> str:
    import requests

    waited = 0
    while waited < max_wait:
        r = requests.get(f"{config.SUNO_BASE_URL}/status/{job_id}", headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        if data.get("status") == "complete":
            return data["audio_url"]
        if data.get("status") == "failed":
            raise RuntimeError(f"Suno job {job_id} fallo: {data}")
        time.sleep(10)
        waited += 10
    raise TimeoutError(f"Suno job {job_id} no termino en {max_wait}s")
