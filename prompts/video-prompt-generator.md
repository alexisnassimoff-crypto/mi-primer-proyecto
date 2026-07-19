# Generador de prompts de video (Atlabs)

Produce el prompt de video para Atlabs a partir de una canción. La consistencia del
personaje la garantiza el **Consistent Character library** de Atlabs (Fenn/amigos ya
lockeados) + este prompt.

## Bloque de estilo base (SIEMPRE incluir)

```
STYLE: soft 3D toddler cartoon, rounded plush shapes, warm golden-hour lighting, cozy
glowing forest (Glimmerwood), pastel + warm palette, gentle soft shadows, big friendly
eyes, simple clean background, slow gentle motion, no fast flashing, no scary elements,
no baked-in text.
```

## Plantilla por canción

```
<STYLE base>
CHARACTER: <personaje del pilar> (usar el lockeado en Atlabs).
SCENE: <lugar de Glimmerwood acorde al tema> — <acción tierna que ilustra la letra>.
BEATS: <2–4 momentos visuales que sigan el estribillo/versos>.
MOOD: cheerful and warm  (o para bedtime: calm, dim, dreamy).
```

### Ejemplos de escena por pilar

- **letters/colors:** objetos/letras/colores que se iluminan al nombrarlos; el personaje
  los toca y brillan.
- **numbers:** objetos que aparecen de a uno mientras se cuenta; el número brilla.
- **animals:** animalitos de peluche que aparecen suave y hacen su sonido.
- **habits:** el personaje mima la acción (lavarse manos, cepillarse) con brillo/burbujas.
- **bedtime:** noche cálida, luna, estrellas titilando lento, movimiento mínimo.

## Reglas duras

- Mismo estilo entre TODOS los videos (marca).
- Movimiento lento; nada de estroboscopio.
- Revisar el output: si el personaje sale inconsistente o "uncanny", regenerar (no
  publicar). Backup: generar el clip con Kling (SafeMotion) usando el mismo prompt.

## Short (vertical 9:16)

Tomar el estribillo (20–40s), reencuadrar a vertical, personaje centrado, texto grande
opcional con el gancho. Objetivo: enganchar en los primeros 2 segundos.
