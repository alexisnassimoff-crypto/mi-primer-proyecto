"""Cliente de voz (LOVO/Genny o ElevenLabs) — OPCIONAL.

Genera intros/dialogos del personaje (ej. "Hi, I'm Lumo! Let's glow!"). No es necesario
para las canciones (las canta Suno); util para intros de marca y mini-dialogos.

NOTA: confirmar endpoint/campos contra la doc del proveedor elegido.
"""
from __future__ import annotations

from pathlib import Path

from .. import config


def generate_voice(song_id: str, text: str, voice_id: str = "lumo_warm") -> Path | None:
    if not text:
        return None
    out = config.OUTPUT_DIR / song_id
    out.mkdir(parents=True, exist_ok=True)
    voice_path = out / f"{song_id}_voice.mp3"

    if config.DRY_RUN:
        voice_path.write_text(f"[DRY_RUN stub] voice: {text}\n", encoding="utf-8")
        print(f"  [voice] (dry-run) voz simulada -> {voice_path.name}")
        return voice_path

    if not config.VOICE_API_KEY:
        print("  [voice] sin VOICE_API_KEY; se omite la voz (opcional)")
        return None

    import requests

    headers = {"xi-api-key": config.VOICE_API_KEY}
    payload = {"text": text, "voice_id": voice_id}
    resp = requests.post(f"{config.VOICE_BASE_URL}/text-to-speech/{voice_id}", json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    voice_path.write_bytes(resp.content)
    print(f"  [voice] voz lista -> {voice_path.name}")
    return voice_path
