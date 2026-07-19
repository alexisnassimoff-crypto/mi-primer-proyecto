# Glimmerwood — Kids Content Engine 🌟

Sistema de producción de contenido infantil musical con IA, diseñado para construir un
canal de YouTube original, monetizable y automatizado — dentro de un presupuesto de
herramientas de **$100–300/mes**.

> **IP original:** *Glimmerwood* — Fenn, una criaturita que brilla, y sus amigos del
> bosque **Glimmerwood**. Contenido musical para niños de 0–5 años, 100% original para
> sobrevivir a las políticas anti-"AI slop" de YouTube y poder licenciar/vender merch.

## Qué es esto

Un motor de contenido de punta a punta:

1. **Creativo (100% generado):** biblia del personaje, letras de canciones, prompts de
   video, guiones, títulos, descripciones y miniaturas.
2. **Producción (automatizada):** canción (Suno) → video con personaje consistente
   (Atlabs) → voz opcional (LOVO/ElevenLabs) → compilado largo → subida (YouTube API).
3. **Operación (mínimo esfuerzo):** el pipeline lee el calendario, produce la próxima
   pieza, la sube y marca el estado. Cargás las keys una vez y corre solo.

## Estructura del repo

| Carpeta | Contenido |
|---|---|
| `character-bible/` | La IP: Fenn, sus amigos, mundo, reglas de estilo y seguridad |
| `brand/` | Nombre del canal, identidad visual, briefs de logo y miniatura |
| `content-plan/` | Calendario de 180 días + lote inicial de canciones listas |
| `prompts/` | Generadores reutilizables (canción, video, metadata) |
| `pipeline/` | Motor de automatización (Python) que orquesta las APIs |
| `docs/` | `SETUP.md` — cómo cargar las keys y arrancar |

## Empezar

1. Leé **[`docs/SETUP.md`](docs/SETUP.md)** para conectar las herramientas.
2. Revisá la **[biblia del personaje](character-bible/character-bible.md)** y elegí/confirmá
   el nombre del canal en **[`brand/brand.md`](brand/brand.md)**.
3. Corré el pipeline en modo prueba: `python -m pipeline.run_next --dry-run`.

## Estado

- ✅ IP, marca, calendario 180 días, lote inicial de canciones, generadores y pipeline.
- ⬜ **Bloqueante:** API keys (Atlabs, Suno, YouTube). Ver `docs/SETUP.md`.

## Expectativa (honesto)

$10k/mes es un objetivo de **12–18 meses**, no garantizado. Los primeros meses suelen
generar ~$0 (hasta entrar al Programa de Socios: 1.000 subs + 4.000 hs). Este sistema
maximiza las probabilidades con calidad + IP original + monetización diversificada.
