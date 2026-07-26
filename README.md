# Dr. Uriel Grümberg — Cirugía Maxilofacial

Landing page para captar turnos por WhatsApp. HTML, CSS y JavaScript puros: sin build,
sin dependencias, sin backend. Se sube tal cual a cualquier hosting estático.

```
index.html            estructura y contenido
css/styles.css        diseño (tokens de color al inicio del archivo)
css/fonts.css         tipografías auto-hospedadas
js/main.js            interacciones + armado de los links de WhatsApp
assets/               imágenes, íconos y tipografías
```

## Verlo localmente

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

> Conviene levantar un servidor en vez de abrir `index.html` con doble clic: por
> seguridad, los navegadores bloquean las tipografías cuando se usa `file://`.

---

## Personalización

### 1. Número de WhatsApp

Está en dos lugares y hay que cambiarlo en ambos:

- `js/main.js`, primera línea de configuración: `var WHATSAPP = '5491132961955';`
- `index.html`: buscar y reemplazar `5491132961955` (son los `href` de respaldo por si
  el visitante tiene JavaScript desactivado).

Formato internacional, sin `+`, sin espacios y sin guiones.

### 2. Mensajes pre-escritos

Cada botón lleva un atributo `data-wa` con el texto que aparece ya escrito en WhatsApp.
Por ejemplo, la tarjeta de ATM:

```html
<a class="card js-wa" data-wa="Hola Dr. Grümberg, quisiera consultar por ATM." ...>
```

Editando ese texto cambia el mensaje. El formulario de la sección **Turnos** arma el suyo
solo, con el nombre y el motivo que carga el paciente.

### 3. Fotos

Los archivos actuales son **placeholders** en SVG. Para reemplazarlos, guardá las fotos
reales en `assets/` y actualizá el `src` en `index.html`:

| Dónde | Archivo actual | Qué poner | Formato sugerido |
|---|---|---|---|
| Hero | `assets/retrato.svg` | Retrato del Dr. | vertical 4:5, ~1200×1500 |
| Perfil | `assets/quirofano.svg` | Foto en quirófano o consultorio | cuadrada, ~1200×1200 |
| Casos | `assets/casos/antes.svg` · `despues.svg` | Caso antes/después | horizontal 4:3, **mismo encuadre las dos** |

Para los casos antes/después: mismo ángulo, misma distancia y misma luz en las dos fotos,
si no el comparador se nota desprolijo. **Publicar sólo con consentimiento firmado del
paciente.**

### 4. Colores

Todo el diseño sale de las variables al inicio de `css/styles.css`:

```css
--bg:#060809;        /* fondo */
--accent:#6FD3E8;    /* celeste de acento */
--txt:#E9EEF3;       /* texto */
```

Cambiando `--accent` cambia toda la paleta de la web.

---

## Antes de publicar

- [ ] Reemplazar las fotos placeholder
- [ ] Completar la **matrícula profesional** en el pie (hay un `TODO` marcado en `index.html`)
- [ ] Confirmar los horarios de atención de la sección Turnos
- [ ] Reemplazar `https://urielgrumberg.com/` por el dominio real en las etiquetas
      `canonical`, `og:url` y en el bloque JSON-LD del final de `index.html`
- [ ] Subir una imagen de 1200×630 a `assets/og.jpg` y descomentar la etiqueta `og:image`
      (es la miniatura que se ve al compartir el link por WhatsApp)

---

## Publicar

**Vercel** — `vercel` en la carpeta, o importar el repo desde vercel.com. No hay que
configurar nada: framework "Other", sin build command.

**Netlify** — arrastrar la carpeta a netlify.com/drop.

**GitHub Pages** — Settings → Pages → Deploy from a branch → rama `main`, carpeta `/`.

---

## Detalles técnicos

- Responsive de 320 px en adelante, sin scroll horizontal.
- Tipografías auto-hospedadas: no hay pedidos a Google Fonts (más rápido y sin cookies de terceros).
- Datos estructurados `Physician` (JSON-LD) para que Google muestre la especialidad y la ubicación.
- Respeta `prefers-reduced-motion`: si el visitante pidió menos animaciones, se desactivan.
- Navegable por teclado; el comparador antes/después se maneja con las flechas.
