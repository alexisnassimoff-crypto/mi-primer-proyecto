# Dr. Uriel Grümberg — Cirugía Maxilofacial

Landing page para captar turnos por WhatsApp. HTML, CSS y JavaScript puros: sin build,
sin dependencias, sin backend. Se sube tal cual a cualquier hosting estático.

```
index.html            estructura y contenido
css/styles.css        diseño (tokens de color al inicio del archivo)
css/fonts.css         tipografías auto-hospedadas
js/main.js            interacciones + armado de los links de WhatsApp
assets/               imágenes, íconos y tipografías
pendientes/           dashboard personal de pendientes: otro proyecto de Vercel (ver más abajo)
```

## Verlo localmente

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

> Conviene levantar un servidor en vez de abrir `index.html` con doble clic: por
> seguridad, los navegadores bloquean las tipografías cuando se usa `file://`.

---

## Pendientes — dashboard personal (carpeta `pendientes/`)

App aparte, con su propia dirección, para organizar pendientes por tema (Central, Familia, La casa,
Harper, Relación con Juli, Gastos de la casa, Compras de la casa) y mandarlos al calendario del
iPhone con alerta e invitados. Pensada para el teléfono: la carga rápida está abajo, al alcance
del pulgar, y entiende castellano:

```
Llamar a Matías mañana 10:00 #central !30m
Pagar expensas el 10 $185.000
Cena con Juli viernes a la noche
Reunión con Miguel el martes de 10 a 11:30 en la oficina miguel@mail.com
Recordar sacar la basura todos los lunes !0
```

| Qué | Cómo se escribe |
|---|---|
| Fecha | `hoy`, `mañana`, `pasado mañana`, `el viernes`, `próximo lunes`, `15/10`, `3 nov`, `en 3 días`, `semana que viene`, `el 20` |
| Hora | `10:00`, `9hs`, `a las 3 de la tarde`, `a la noche`, `de 10 a 11:30`, `en 2 horas` |
| Tema | `#central`, `#casa`, `#gastos`… (si no se indica, lo deduce del texto) |
| Alerta | `!15m`, `!1h`, `!1d`, `!0` (en el momento), `!no`; se puede poner una segunda |
| Duración | `~45m`, `dura 2h`, `(1h)` |
| Invitados | `@matias`, o un mail suelto; si va dentro de la frase («Cena con @juli y @ana») el nombre queda en el título |
| Monto | `$185.000`, `5 lucas`, `3000 pesos` |
| Otros | `urgente` (prioridad), `todos los lunes` / `cada mes` (repetición), `recordar …` (recordatorio) |

```
pendientes/index.html       estructura
pendientes/app.css          diseño (tokens de color al inicio, claro y oscuro)
pendientes/app.js           la app: tablero, agenda, hoja de edición, ajustes
pendientes/parser.js        carga rápida en castellano
pendientes/ics.js           generador de archivos .ics (lo comparte con el API)
pendientes/sw.js            abre sin conexión
pendientes/fonts/           tipografías (copia de assets/fonts, para que la carpeta sea autónoma)
pendientes/api/ics.js       función de Vercel: sirve un evento como text/calendar
```

**Publicación.** Es su propio proyecto en Vercel, separado de la landing: importar este mismo repo
con **Root Directory = `pendientes`** (preset Other, sin build command). Así queda en una dirección
propia y `pendientes/api/ics.js` se publica como `/api/ics`. El `vercel.json` de la raíz hace que la
landing redirija `/pendientes/` a esa dirección.

**Calendario.** Cada pendiente con fecha tiene «Agregar al iPhone»: en Vercel es un link a
`/api/ics?...` que Safari abre con la vista nativa de Calendario (un toque y «Añadir»), con la
alerta (`VALARM`), los invitados con mail (`ATTENDEE`), la repetición (`RRULE`) y el lugar. Si el
API no existe (otro hosting o servidor local) se descarga el `.ics`. También hay link a Google
Calendar (manda la invitación formal si hay mails), invitación por WhatsApp o Mail con el detalle
y un link para que la otra persona lo agregue a su calendario, y «Mandar toda la agenda al
calendario» en Ajustes, que importa todos los pendientes con fecha de una vez.

**Datos.** Todo se guarda en `localStorage` del dispositivo; no hay cuenta ni servidor. En Ajustes
hay respaldo (`.json`) y restauración. Para tenerla como app en el iPhone: Safari → Compartir →
«Agregar a inicio».

**Verlo localmente:** el mismo `python3 -m http.server 8000` de arriba y abrir
`http://localhost:8000/pendientes/`. Para probar el API hace falta `cd pendientes && vercel dev`
(o el deploy).

---

## Personalización

### 1. Número de WhatsApp

Está en dos lugares y hay que cambiarlo en ambos:

- `js/main.js`, primera línea de configuración: `var WHATSAPP = '5493413168083';`
- `index.html`: buscar y reemplazar `5493413168083` (son los `href` de respaldo por si
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

Todas las imágenes son reales; no queda ningún placeholder.

| Dónde | Archivo | Qué es |
|---|---|---|
| Hero | `assets/uriel.jpg` | Retrato de estudio, recortado a 4:5 |
| Perfil | `assets/quirofano.jpg` | Foto operando, recortada a cuadrado |
| Compartir | `assets/og.jpg` | Equipo en quirófano, 1200×630, con el nombre sobreimpreso |
| Casos | `assets/casos/caso1-*.jpg` | Caso real en tres vistas, recortado del material de Instagram |

`assets/og.jpg` es la miniatura que aparece al pegar el link en WhatsApp o redes.

Para regenerar los recortes a partir de fotos nuevas: `herramientas/procesar-imagenes.py`.

### 4. Casos antes/después

Cada archivo de `assets/casos/` es **un solo JPG** con las dos fotos ya pegadas (antes a la
izquierda, después a la derecha); las etiquetas ANTES / DESPUÉS las pone la web por CSS.
El selector Frente / Tres cuartos / Perfil cambia entre los tres archivos.

Para sumar un segundo caso hacen falta las tres vistas con el mismo encuadre y
**consentimiento firmado del paciente**.

### 5. Colores

Todo el diseño sale de las variables al inicio de `css/styles.css`:

```css
--bg:#060809;        /* fondo */
--accent:#6FD3E8;    /* celeste de acento */
--txt:#E9EEF3;       /* texto */
```

Cambiando `--accent` cambia toda la paleta de la web.

---

## Antes de publicar

- [ ] Completar la **matrícula profesional** en el pie (hay un `TODO` marcado en `index.html`)
- [ ] Confirmar los horarios de atención de la sección Turnos
- [ ] Agregar `<link rel="canonical">` y `<meta property="og:url">` con la URL definitiva
      (hay un `TODO` marcado en el `<head>`). Se quitaron a propósito para no dejar una
      URL rota; la miniatura al compartir ya funciona porque `og:image` apunta al
      archivo del repositorio.

---

## Publicar

**Vercel** (el que se usa) — importar el repo desde vercel.com. Framework preset "Other",
sin build command y sin output directory. Publica desde `main`.

**Netlify** — arrastrar la carpeta a netlify.com/drop.

**GitHub Pages** — descartado: activar Pages por primera vez requiere permisos que el
token de Actions no tiene, y hay que hacerlo a mano desde Settings.

---

## Detalles técnicos

- Responsive de 320 px en adelante, sin scroll horizontal.
- Coberturas listadas debajo de los tratamientos y en las preguntas frecuentes.
- Optimizada para mobile: CTA de WhatsApp arriba del pliegue, barra fija de WhatsApp que
  aparece al scrollear y se esconde sobre el formulario, tarjetas compactas y formulario
  de dos campos (el resto se escribe dentro de WhatsApp).
- Tipografías auto-hospedadas: no hay pedidos a Google Fonts (más rápido y sin cookies de terceros).
- Datos estructurados `Physician` (JSON-LD) para que Google muestre la especialidad y la ubicación.
- Respeta `prefers-reduced-motion`: si el visitante pidió menos animaciones, se desactivan.
- Navegable por teclado y con foco visible en todos los controles.
