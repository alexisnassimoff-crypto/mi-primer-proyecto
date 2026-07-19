"""Orquestador principal: produce y sube la proxima pieza del plan.

Uso:
  python -m pipeline.run_next --dry-run       # prueba el flujo completo sin API ni keys
  python -m pipeline.run_next                 # produce la proxima cancion 'ready'
  python -m pipeline.run_next --song S003     # produce una cancion especifica
  python -m pipeline.run_next --publish        # sube como 'public' (default: 'private')
  python -m pipeline.run_next --make-compilation "Learning Songs Vol 1"

Flujo por cancion: Suno (cancion) -> Atlabs (video 16:9 con personaje consistente)
-> Atlabs/FFmpeg (Short 9:16) -> voz opcional -> YouTube (subida).

SEGURIDAD: por defecto sube en 'private'. Un humano DEBE revisar el video de principio a
fin (checklist en docs/SETUP.md) antes de pasarlo a 'public'.
"""
from __future__ import annotations

import argparse
import sys

from . import assemble, config, content_plan
from .clients import atlabs_client, suno_client, voice_client, youtube_client


def produce_song(song: dict, state: dict, publish: bool) -> None:
    song_id = song["id"]
    payload = content_plan.load_ready_payload(song_id)
    if not payload:
        print(f"[!] {song_id} no tiene payload en ready.json — se omite.")
        return

    print(f"\n▶ Produciendo {song_id}: {song['title']}")
    privacy = "public" if publish else "private"

    # 1) Cancion
    mp3 = suno_client.generate_song(song_id, song["title"], payload["suno_prompt"], payload["lyrics"])

    # 2) Video largo (16:9) con personaje consistente
    video = atlabs_client.generate_video(
        song_id, mp3, payload["scene_prompt"], character_ref_id=payload.get("character", "fenn"), aspect="16:9"
    )

    # 3) Short vertical (9:16)
    short = atlabs_client.generate_video(
        song_id, mp3, payload.get("short_scene", payload["scene_prompt"]),
        character_ref_id=payload.get("character", "fenn"), aspect="9:16",
    )

    # 4) Voz opcional (intro de marca)
    voice_client.generate_voice(song_id, f"Hi! I'm here in Glimmerwood. Let's glow!")

    # 5) Subidas
    video_id = youtube_client.upload_video(
        video, payload["youtube_title"], payload["description"], payload["tags"], privacy=privacy
    )
    short_title = payload["youtube_title"].split(" | ")[0] + " #Shorts | Glimmerwood"
    short_id = youtube_client.upload_video(
        short, short_title, payload["description"], payload["tags"] + ["shorts"], privacy=privacy
    )

    content_plan.mark_produced(state, song_id, {
        "title": song["title"], "video": str(video), "short": str(short),
        "video_id": video_id, "short_id": short_id, "privacy": privacy,
    })
    if publish:
        content_plan.mark_published(state, song_id, video_id)

    print(f"✓ {song_id} listo. video={video_id} short={short_id} ({privacy})")
    print("  ⚠ Revisar el video completo antes de publicar (checklist en docs/SETUP.md).")


def make_compilation(state: dict, name: str, publish: bool) -> None:
    produced = state.get("produced", {})
    videos = [config.OUTPUT_DIR / f"{sid}" / f"{sid}_video.mp4" for sid in produced]
    if not videos:
        print("[!] No hay videos producidos aun para compilar.")
        return
    print(f"\n▶ Armando compilado '{name}' con {len(videos)} canciones")
    out = assemble.make_compilation(videos, name.replace(" ", "_"))
    privacy = "public" if publish else "private"
    youtube_client.upload_video(
        out, f"{name} 🌟 Kids Songs | Glimmerwood",
        "A cozy collection of learning and lullaby songs with Glimmerwood. 🌟 Subscribe!",
        ["kids songs compilation", "nursery rhymes", "learning songs", "fenn and friends"],
        privacy=privacy,
    )
    print(f"✓ Compilado '{name}' -> {out.name} ({privacy})")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Glimmerwood — produce la proxima pieza.")
    parser.add_argument("--dry-run", action="store_true", help="Forzar modo simulado (sin API).")
    parser.add_argument("--live", action="store_true", help="Forzar modo real (requiere keys).")
    parser.add_argument("--song", help="Producir una cancion especifica por id (ej. S003).")
    parser.add_argument("--publish", action="store_true", help="Subir como 'public' (default: private).")
    parser.add_argument("--make-compilation", metavar="NAME", help="Armar y subir un compilado.")
    args = parser.parse_args(argv)

    if args.dry_run:
        config.DRY_RUN = True
    if args.live:
        config.DRY_RUN = False

    config.ensure_dirs()
    mode = "DRY-RUN (simulado)" if config.DRY_RUN else "LIVE (real)"
    print(f"== Glimmerwood pipeline — modo {mode} ==")

    if not config.DRY_RUN:
        missing = config.missing_keys()
        if missing:
            print(f"[!] Faltan keys para modo real: {', '.join(missing)}. Ver docs/SETUP.md.")
            return 1

    state = content_plan.load_state()

    if args.make_compilation:
        make_compilation(state, args.make_compilation, args.publish)
        return 0

    if args.song:
        song = next((s for s in content_plan.load_songs() if s["id"] == args.song), None)
        if not song:
            print(f"[!] No existe la cancion {args.song}.")
            return 1
    else:
        song = content_plan.next_song(state)
        if not song:
            print("Todo el contenido 'ready' ya fue producido. Agregá mas o generá las 'planned'.")
            return 0

    produce_song(song, state, args.publish)
    return 0


if __name__ == "__main__":
    sys.exit(main())
