"""Ensamblado con FFmpeg: compilados largos (loop-and-compile) y recorte de Shorts.

Atlabs ya entrega el video de cada cancion; aca solo (1) unimos varias canciones en un
compilado largo, y (2) reencuadramos un Short vertical si hiciera falta un recorte propio.

DRY_RUN: escribe manifiestos en vez de correr FFmpeg.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

from . import config


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def make_compilation(video_paths: list[Path], out_name: str) -> Path:
    """Une varias canciones (mp4) en un compilado largo."""
    config.ensure_dirs()
    out_path = config.OUTPUT_DIR / f"{out_name}.mp4"

    if config.DRY_RUN:
        listing = "\n".join(str(p) for p in video_paths)
        out_path.with_suffix(".txt").write_text(
            f"[DRY_RUN stub] compilado {out_name} con:\n{listing}\n", encoding="utf-8"
        )
        print(f"  [assemble] (dry-run) compilado simulado -> {out_path.name} ({len(video_paths)} canciones)")
        return out_path

    concat_file = config.OUTPUT_DIR / f"{out_name}_concat.txt"
    concat_file.write_text("".join(f"file '{p.resolve()}'\n" for p in video_paths), encoding="utf-8")
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(out_path)])
    print(f"  [assemble] compilado -> {out_path.name}")
    return out_path


def make_short(video_path: Path, out_name: str, start: float = 0.0, duration: float = 30.0) -> Path:
    """Recorta un Short vertical 9:16 (fallback si no se genero directo en Atlabs)."""
    config.ensure_dirs()
    out_path = config.OUTPUT_DIR / f"{out_name}_short.mp4"

    if config.DRY_RUN:
        out_path.with_suffix(".txt").write_text(
            f"[DRY_RUN stub] short de {video_path} [{start}s +{duration}s] 9:16\n", encoding="utf-8"
        )
        print(f"  [assemble] (dry-run) short simulado -> {out_path.name}")
        return out_path

    # Recorte + crop central a 9:16
    vf = "crop=ih*9/16:ih,scale=1080:1920"
    _run([
        "ffmpeg", "-y", "-ss", str(start), "-t", str(duration), "-i", str(video_path),
        "-vf", vf, "-c:a", "copy", str(out_path),
    ])
    print(f"  [assemble] short -> {out_path.name}")
    return out_path
