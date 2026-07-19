"""Cliente de YouTube — sube el video con metadata y Made-for-Kids = ON.

Usa la YouTube Data API v3 (OAuth). DRY_RUN devuelve un video_id simulado.

Requiere: client_secret.json (OAuth desktop) y un token.json generado la primera vez.
Ver docs/SETUP.md. Alternativa: youtube-mcp-server via MCP.
"""
from __future__ import annotations

from pathlib import Path

from .. import config


def upload_video(
    video_path: Path,
    title: str,
    description: str,
    tags: list[str],
    thumbnail: Path | None = None,
    privacy: str = "private",   # empezar en 'private' y pasar a 'public' tras revision humana
    category_id: str = "27",     # 27 = Education (o 24 = Entertainment)
) -> str:
    if config.DRY_RUN:
        fake_id = f"dryrun_{video_path.stem}"
        print(f"  [youtube] (dry-run) subida simulada '{title}' -> {fake_id} ({privacy})")
        return fake_id

    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    creds = Credentials.from_authorized_user_file(config.YOUTUBE_TOKEN_FILE)
    youtube = build("youtube", "v3", credentials=creds)

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,
            "defaultLanguage": config.DEFAULT_LANGUAGE,
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": config.MADE_FOR_KIDS,  # COPPA
        },
    }
    media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        _, response = request.next_chunk()
    video_id = response["id"]
    print(f"  [youtube] subido -> https://youtu.be/{video_id} ({privacy})")

    if thumbnail and thumbnail.exists():
        youtube.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(thumbnail))).execute()

    return video_id
