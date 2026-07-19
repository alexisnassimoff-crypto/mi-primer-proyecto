# Generador de canciones (template reutilizable)

Este template produce una canción original nueva coherente con la IP. Se usa por cada
entrada `planned` de `content-plan/songs.json`. Lo ejecuta Claude (o cualquier LLM) para
generar letra + prompt de Suno; el resultado se pega en Suno.

## Instrucciones para el modelo

> Escribí una canción infantil ORIGINAL para el canal *Glimmerwood* (0–5 años).
> Respetá la biblia (`character-bible/character-bible.md`). Entradas: `title`, `pillar`,
> `character`, `theme`.
>
> Requisitos:
> - **100% original** (melodía vía Suno + letra propia). Nunca copiar letras/melodías con
>   copyright.
> - Estructura toddler: Chorus pegadizo + 2 versos + repetición del chorus. 90–150s.
> - Lenguaje simple, positivo, repetitivo. Incluir el nombre del personaje en el chorus si
>   ayuda a la marca. Usar el motivo "glow/brillar" de la IP cuando encaje.
> - Cero contenido de miedo/adulto/negativo (ver reglas de seguridad §6).
> - Para pilar `bedtime`: tono calmo, lento, imágenes de sueño.
>
> Salida (formato exacto):
> ```
> ## <title>  ·  Pilar: <pillar> (<character>)
> Suno: <prompt de Suno: género + instrumentos + mood + BPM>
> Letra:
> (Chorus) ...
> (Verse 1) ...
> (Chorus)
> (Verse 2) ...
> (Chorus)
> ```

## Guía de prompt de Suno por pilar

| Pilar | Tags base | BPM |
|---|---|---|
| letters / colors | `children's music, cheerful nursery rhyme, kids choir, ukulele, glockenspiel` | 108–116 |
| numbers | `children's counting song, upbeat, kids choir, marimba, claps` | 116–122 |
| animals | `children's animal song, playful, banjo, ukulele, animal sounds` | 112–118 |
| habits / vehicles | `bouncy children's song, fun, kids choir, claps, playful` | 116–122 |
| emotions | `warm gentle children's song, soft, kids choir, piano` | 92–104 |
| bedtime | `gentle lullaby, soft, calm, music box, glockenspiel, dreamy` | 60–72 |

Siempre agregar al final del prompt: `warm, simple melody, child-safe, clear vocals`.
