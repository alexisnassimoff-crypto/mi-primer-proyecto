"""Cliente de Atlabs — genera el video animado con el personaje CONSISTENTE.

El personaje (Fenn/amigos) se lockea UNA vez en la Consistent Character library de Atlabs
(desde su UI) y aca se referencia por id. Se le pasa la cancion (mp3/url) + el prompt de
escena y Atlabs devuelve el video con subtitulos y (opcional) miniatura.

NOTA: confirmar endpoints/campos exactos contra la doc de la API de Atlabs.
"""
from __future__ import annotations

import time
from pathlib import Path

from .. import config


def generate_video(
    song_id: str,
    song_mp3: Path,
    scene_prompt: str,
    character_ref_id: str = "fenn",
    style: str = "3d_cartoon",
    aspect: str = "16:9",
) -> Path:
    out = config.OUTPUT_DIR / song_id
    out.mkdir(parents=True, exist_ok=True)
    suffix = "short" if aspect == "9:16" else "video"
    mp4_path = out / f"{song_id}_{suffix}.mp4"

    if config.DRY_RUN:
        mp4_path.write_text(
            f"[DRY_RUN stub] Atlabs video for {song_id}\ncharacter: {character_ref_id}\n"
            f"style: {style} aspect: {aspect}\nscene: {scene_prompt}\n",
            encoding="utf-8",
        )
        print(f"  [atlabs] (dry-run) video simulado -> {mp4_path.name}")
        return mp4_path

    import requests

    headers = {"Authorization": f"Bearer {config.ATLABS_API_KEY}"}
    payload = {
        "audio_source": str(song_mp3),      # o URL subida; ver doc
        "scene_prompt": scene_prompt,
        "character_id": character_ref_id,    # personaje lockeado (consistencia)
        "style": style,
        "aspect_ratio": aspect,
        "captions": True,
        "generate_thumbnail": aspect == "16:9",
        "child_safe": True,
    }
    resp = requests.post(f"{config.ATLABS_BASE_URL}/videos", json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    task_id = resp.json()["task_id"]

    video_url = _poll(task_id, headers)
    video = requests.get(video_url, timeout=300)
    video.raise_for_status()
    mp4_path.write_bytes(video.content)
    print(f"  [atlabs] video listo -> {mp4_path.name}")
    return mp4_path


def _poll(task_id: str, headers: dict, max_wait: int = 1200) -> str:
    import requests

    waited = 0
    while waited < max_wait:
        r = requests.get(f"{config.ATLABS_BASE_URL}/videos/{task_id}", headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        if data.get("status") in ("complete", "succeeded"):
            return data["output_url"]
        if data.get("status") in ("failed", "error"):
            raise RuntimeError(f"Atlabs task {task_id} fallo: {data}")
        time.sleep(15)
        waited += 15
    raise TimeoutError(f"Atlabs task {task_id} no termino en {max_wait}s")
