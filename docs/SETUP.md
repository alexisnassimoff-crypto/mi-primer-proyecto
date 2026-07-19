# Setup — conectar todo y arrancar

Objetivo: cargar las keys **una vez** y que el pipeline produzca y suba con mínimo
esfuerzo. Mientras no tengas keys, todo corre en **modo simulado** (`--dry-run`).

## 0. Requisitos

- **Python 3.10+** y **FFmpeg** (binario del sistema: `apt install ffmpeg` /
  `brew install ffmpeg`).
- Instalar dependencias: `pip install -r pipeline/requirements.txt`.

## 1. Probar sin keys (ya funciona)

```bash
python -m pipeline.run_next --dry-run
```

Simula el flujo completo (canción → video → short → subida) y escribe manifiestos en
`output/`. Sirve para ver el sistema andando antes de gastar un centavo.

## 2. Conseguir las keys (esto es lo único bloqueante)

| Servicio | Para qué | Dónde | Costo aprox. |
|---|---|---|---|
| **Atlabs** ⭐ | Video + personaje consistente | atlabs.ai → cuenta → API key | $39–79/mes |
| **Suno** | Canciones | suno.com (API propia o proveedor) | $10–30/mes |
| **LOVO/ElevenLabs** | Voz (opcional) | lovo.ai / elevenlabs.io | $0–22/mes |
| **YouTube Data API** | Subir videos | Google Cloud Console (OAuth) | gratis |

### YouTube (OAuth, una sola vez)

1. Google Cloud Console → nuevo proyecto → habilitar **YouTube Data API v3**.
2. Crear credenciales **OAuth (Desktop)** → descargar `client_secret.json` a la raíz.
3. La primera subida real abre el navegador para autorizar y genera `token.json`.
   *(Alternativa sin código: instalar `youtube-mcp-server` como MCP.)*

## 3. Configurar

```bash
cp pipeline/.env.example pipeline/.env
# editar pipeline/.env: poner las keys y DRY_RUN=0
```

## 4. Lockear el personaje en Atlabs (clave de consistencia)

En la UI de Atlabs, subí el diseño de **Lumo** y guardalo en la *Consistent Character
library*. Anotá el `character_id` y usalo en `content-plan/ready.json` (campo `character`).
Repetí para Rosa, Beep, Sunny, Vee y Plum. Esto es lo que hace que el personaje salga
**idéntico** en cada video.

## 5. Producir

```bash
python -m pipeline.run_next                       # produce la próxima canción (private)
python -m pipeline.run_next --song S006           # una específica
python -m pipeline.run_next --make-compilation "Learning Songs Vol 1"
```

Sube todo como **private** por defecto. Nada se hace público sin tu OK.

## 6. Checklist de revisión humana (antes de pasar a público)

- [ ] El personaje se ve **consistente** (mismo color/proporción) en todo el video.
- [ ] Nada perturbador, raro ("uncanny") ni con flashes rápidos.
- [ ] Audio limpio, letra correcta, sin palabras raras.
- [ ] Miniatura clara y legible en celular.
- [ ] Título/descripción/tags correctos; **Made for Kids = ON**.
- [ ] Aporta algo original (no es plantilla vacía) → cumple política de YouTube.

Recién ahí: `--publish` o cambiá la visibilidad a público desde YouTube Studio.

## 7. Automatizar la cadencia diaria (opcional)

Cuando valides el flujo, se puede agendar `run_next` (cron / Routine / n8n) para producir
en cola y subir como *private* para tu revisión. El objetivo: que tu único trabajo sea la
**revisión de calidad**, no la producción.

---

### Estado actual

- ✅ Creativo, marca, calendario, lote inicial, pipeline y docs — listos en el repo.
- ⬜ Bloqueante: cargar las keys de la tabla del paso 2.
