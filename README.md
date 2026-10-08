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

App aparte, con su propia dirección, para organizar pendientes por tema (Central, Familia,
La casa, Harper, Relación con Juli, Gastos de la casa, Compras de la casa) y mandarlos al
calendario del iPhone con aviso e invitados.

Pensada para el teléfono y para no marear:

- **Inicio** muestra solo lo de hoy (y lo atrasado) y los temas como botones grandes. Cada tema se
  abre en su propia pantalla; **Agenda** ordena todo por día.
- **Nuevo** pregunta de a una cosa: qué, tema, cuándo, hora y aviso. Lo demás (repetir, con quién,
  dónde, monto, importante, notas) queda guardado en «Más opciones». Se puede guardar en cualquier
  paso.
- Cada pendiente abre una **ficha** con acciones claras: marcar hecho, agregar al Calendario,
  invitar, editar y eliminar.
- Accesible: botones grandes con texto, contraste AA en claro y oscuro, la letra sigue el tamaño
  elegido en el iPhone y el gesto de volver funciona.

Si en la frase ya decís el día, la hora o el aviso, los entiende y se saltea esas preguntas:

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
pendientes/app.js           la app: inicio, temas, agenda, ficha, formulario paso a paso y ajustes
pendientes/parser.js        entiende frases en castellano (fechas, horas, avisos, montos)
pendientes/temas.js         temas de fábrica, alias y palabras clave (los comparte con el API)
pendientes/avisos.js        cómo se escriben y se leen los avisos (lo comparte con el API)
pendientes/ics.js           generador de archivos .ics (lo comparte con el API)
pendientes/sw.js            abre sin conexión
pendientes/fonts/           tipografías (copia de assets/fonts, para que la carpeta sea autónoma)
pendientes/api/ics.js       función de Vercel: sirve uno o varios eventos como text/calendar
pendientes/api/datos.js     función de Vercel: lee y guarda en Airtable (el único que conoce el token)
pendientes/api/calendario.js función de Vercel: el calendario suscrito, armado desde Airtable, con el resumen de la mañana
pendientes/api/anotar.js    función de Vercel: anota un pendiente desde Siri o la hoja de compartir
pendientes/api/factura.js   función de Vercel: lee una factura con una foto (Claude)
pendientes/api/_airtable.js acceso a Airtable que comparten las funciones (no es una dirección)
pendientes/api/_zona.js     zona horaria en el servidor (no es una dirección)
pendientes/vercel.json      le da más tiempo a las funciones (30 s; 60 s a la factura)
pendientes/GUIA.md          lo que queda de tu lado para activar cada cosa, paso a paso
```

**Publicación.** Es su propio proyecto en Vercel, separado de la landing: importar este mismo repo
con **Root Directory = `pendientes`** (preset Other, sin build command). Así queda en una dirección
propia y `pendientes/api/ics.js` se publica como `/api/ics`. El `vercel.json` de la raíz hace que la
landing redirija `/pendientes/` a esa dirección.

**Calendario.** Cada pendiente con fecha tiene «Agregar al iPhone»: en Vercel es un link a
`/api/ics?...` que Safari abre con la vista nativa de Calendario (un toque y «Añadir»), con la
alerta (`VALARM`), los invitados con mail (`ATTENDEE`), la repetición (`RRULE`) y el lugar. Si el
API no existe (otro hosting o servidor local) se descarga el `.ics`. También hay link a Google
Calendar (manda la invitación formal si hay mails) e invitación por WhatsApp o Mail con el detalle
y un link para que la otra persona lo agregue a su calendario.

En Ajustes → **Calendario del iPhone**:

- **Mandar todo al Calendario** (o «Agregar todo una sola vez»): un link común a
  `/api/ics?z=1&lote=…` con todos los pendientes con fecha comprimidos adentro; Safari lo abre en
  Calendario con «Añadir todo». No necesita Airtable. Si son demasiados para un link, usa el
  calendario de Airtable; en la compu se baja el `.ics`. (Antes era un formulario POST, y el iPhone
  no lo abre.)
- **Suscribirme en el Calendario** (con el respaldo conectado): `webcal://…/api/calendario?k=…`.
  El iPhone vuelve a pedirlo cada tanto, así que lo nuevo aparece solo y lo hecho o borrado
  desaparece, con sus avisos. La `k` sale de `PENDIENTES_CLAVE` (la entrega `/api/datos` a la app
  conectada) y solo sirve para leer el calendario; si se cambia la clave, hay que volver a
  suscribirse. Si los avisos no suenan, en la suscripción apagar «Eliminar alarmas». Las horas se
  pasan a UTC con la zona horaria que la app guarda en *Ajustes* (Argentina si no hay). La respuesta
  queda 10 minutos en la red de Vercel, así el Calendario puede pedirla seguido sin gastar las
  llamadas a Airtable. Cuando la pide la suscripción (no un navegador), se anota en *Ajustes*, fila
  «calendario» (como mucho cada 30 minutos). Con eso la app muestra «Suscripto» y deja de ofrecer
  agregar pendientes a mano, para que no queden repetidos. Si pasan 10 días sin que la pida,
  vuelve a ofrecerlo.

**Dictar.** En el iPhone, el micrófono de la cabecera (y «Decirlo con la voz» en Nuevo) abre Nuevo
con el teclado listo y la pista «Tocá el micrófono del teclado»: es el dictado de Apple, que anda
siempre, también con la app en la pantalla de inicio (ahí iOS no ofrece el dictado de la web,
`webkitSpeechRecognition`, y la hoja quedaba esperando). En otros equipos con dictado en el
navegador, «Te escucho» escucha y arma el pendiente; la X y «Listo» cierran al instante, termina
solo tras 2 s de silencio y, si en 8 s no llega nada o falta el permiso, cierra y ofrece el teclado.

**Anotar sin abrir la app.** `POST /api/anotar?k=LLAVE` con `texto=…` (formulario o JSON; también
`GET …&texto=…`) entiende la frase con el mismo `parser.js` de la app, la guarda en Airtable y
contesta en texto plano para que Siri lo lea («Anotado en Gastos de la casa: Pagar ABL, mañana a
las 12:00. Aviso 15 min antes.»). La llave sale de `PENDIENTES_CLAVE` (la entrega `/api/datos`) y
solo sirve para anotar. En Ajustes → «Anotar con Siri o desde WhatsApp» está el link para el atajo y
los pasos para armarlo. Abrir la app con `?nuevo=texto` abre el formulario ya entendido.

**Resumen de la mañana.** Con la suscripción al calendario, cada día que tiene algo aparece un
evento corto a la hora elegida (Ajustes → Calendario del iPhone → «Resumen de la mañana», a las 8
por defecto) con aviso en el momento: «Hoy: ABL 12:00, Café 14:30 · 1 atrasado», y en el detalle la
lista completa, los atrasados y lo que vence en la semana con los montos. Se arma para hoy y los
seis días siguientes, así está listo aunque el Calendario se actualice tarde.

**Gastos del mes.** Al marcar hecho un pendiente con monto queda un pago (tabla *Pagos* en
Airtable: Qué, Monto, Fecha, Tema, Pendiente, ID). En Inicio aparece «Gastos de octubre: pagaste
$X · falta pagar $Y» y al tocarlo, la pantalla del mes: pagado, comparación con el mes anterior, lo
que falta pagar y la lista de pagos (se pueden borrar, con Deshacer). «Anotar un gasto ya pagado»
crea el pendiente hecho y el pago de una vez. Volver un pendiente a pendientes saca su pago.

**Foto de una factura.** En Nuevo, «Leer una factura con la cámara» achica la foto y la manda a
`POST /api/factura` (pide la clave de la app), que se la da a Claude con un esquema JSON y devuelve
quién cobra, qué es, el monto y el vencimiento. El formulario queda armado («Pagar Edenor octubre
2026», tema Gastos, todo el día el vencimiento, aviso dos días antes a las 9, monto y notas). Hace
falta `ANTHROPIC_API_KEY` en Vercel (ver `pendientes/GUIA.md`); sin ella el botón avisa.

**Posponer y mandar la lista.** En la ficha: «Pasar a mañana», «Al lunes», «Una semana más» (o
«Para hoy» / «Para mañana» si no tenía fecha), con Deshacer. En la pantalla de un tema con más de
un pendiente: «Mandar la lista» comparte el tema con sus pendientes, fechas y montos (WhatsApp,
Mail…) o lo copia.

**Datos.** Cada equipo guarda todo en su `localStorage`, así la app abre al instante y funciona sin
conexión. Con el **respaldo en Airtable** conectado, además, cada cambio se sube a la base
«Pendientes» (tablas *Pendientes*, *Temas* y *Ajustes*) y se trae lo que cambió en otros equipos.
Lo que se edita o se agrega directo en Airtable también llega a la app (un tema nuevo escrito ahí se
crea solo), y borrar en la app marca «Eliminado» en vez de borrar la fila: nada se pierde. En
Ajustes también hay copia local (`.json`) y restauración. Para tenerla como app en el iPhone:
Safari → Compartir → «Agregar a inicio».

**Configurar el respaldo en Airtable** (una sola vez):

1. En https://airtable.com/create/tokens crear un token con los permisos `data.records:read` y
   `data.records:write`, con acceso solo a la base «Pendientes».
2. En Vercel, proyecto `pendientes-ale` → Settings → Environment Variables, agregar
   `AIRTABLE_TOKEN` (el token) y `PENDIENTES_CLAVE` (una clave a elección, de 8 caracteres o más).
   Para leer facturas con una foto, también `ANTHROPIC_API_KEY`.
3. Volver a publicar (un merge o «Redeploy»).
4. En cada equipo: Ajustes → Respaldo en Airtable → escribir la clave → Conectar. La primera vez
   sube todo lo que había en ese equipo.

La base está en `applYsT94l8k9pbu4`; para usar otra con la misma estructura, definir
`AIRTABLE_BASE_ID`. Las tablas y columnas se leen por su id, así que se pueden renombrar en Airtable
sin romper nada.

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
