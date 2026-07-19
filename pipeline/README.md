# Pipeline

Motor de automatización que orquesta las APIs para producir y subir cada pieza.

```
run_next.py        # orquestador (CLI). Empezá acá.
config.py          # env, rutas, DRY_RUN, keys
content_plan.py    # carga songs.json / ready.json y lleva estado (output/state.json)
assemble.py        # FFmpeg: compilados y recorte de Shorts
clients/
  suno_client.py   # cancion
  atlabs_client.py # video + personaje consistente
  voice_client.py  # voz (opcional)
  youtube_client.py# subida (Made for Kids = ON)
```

## Correr

```bash
python -m pipeline.run_next --dry-run     # simulado, sin keys
python -m pipeline.run_next               # real (tras cargar .env)
```

Ver [`../docs/SETUP.md`](../docs/SETUP.md) para conectar las keys.

> **Nota de ingeniería:** los endpoints/campos exactos de Suno y Atlabs deben confirmarse
> contra la doc oficial de cada API (están centralizados en `config.py` y en cada cliente
> para ajustarlos sin reescribir el flujo). El modo `--dry-run` funciona 100% offline y
> valida toda la orquestación.
