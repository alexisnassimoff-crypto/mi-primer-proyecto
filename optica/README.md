# OJO — óptica online multimarca

Tienda online de anteojos: sol, receta, configurador de cristales oftálmicos, probador
virtual, medidor de distancia pupilar, turnos con oftalmólogo y checkout con Mercado Pago.

HTML, CSS y JavaScript puros — **sin build, sin framework, sin dependencias** — más un
puñado de funciones serverless en `api/`. Se publica tal cual.

> **El nombre "OJO" es provisional.** Cambiarlo es un comando:
> `./herramientas/renombrar-marca.sh NUEVONOMBRE nuevodominio.com.ar`

---

## Verlo funcionando

```bash
cd optica
python3 -m http.server 8000
# abrir http://localhost:8000
```

Conviene levantar un servidor en vez de abrir el HTML con doble clic: con `file://` los
navegadores bloquean las tipografías y la cámara del probador.

**Todo el recorrido anda sin credenciales.** Los pagos, el login de Google y los turnos
arrancan en modo demo (`simulado: true` en `js/config.js`), así se puede recorrer la
compra entera antes de configurar nada.

---

## Estructura

```
index.html         portada
tienda.html        catálogo con filtros (el estado vive en la URL)
producto.html      ficha + configurador de cristales      ?sku=CE-TRACE-C1
probador.html      probador virtual + medidor de DP
turnos.html        reserva con oftalmólogo
carrito.html       carrito
checkout.html      datos, envío y pago
gracias.html       post-compra (también recibe la vuelta de Mercado Pago)
cuenta.html        pedidos, recetas guardadas y turnos

css/
  base.css         tokens de color, tipografía, layout   ← la paleta empieza acá
  componentes.css  botones, cabecera, tarjetas, formularios, cajón, pie
  paginas.css      lo específico de cada página
  fonts.css        tipografías auto-hospedadas

js/
  config.js        ⭐ marca, envíos, pagos, promos, cupones, turnos, textos legales
  catalogo.js      ⭐ productos y precios
  cristales.js     motor óptico: índices, tratamientos, validación de receta
  promos.js        motor de promociones (lo comparten el navegador y el servidor)
  marcos.js        generador de anteojos en SVG
  carrito.js       estado del carrito
  auth.js          login con Google + datos de la cuenta
  ui.js            cabecera, pie, cajón y avisos (se inyectan en todas las páginas)
  util.js          helpers compartidos
  home.js · tienda.js · producto.js · probador.js · turnos.js ·
  pagina-carrito.js · checkout.js · gracias.js · cuenta.js

api/
  checkout.js      crea la preferencia de Mercado Pago
  webhook.js       recibe la confirmación de pago
  auth.js          verifica el token de Google
  turnos.js        recibe la reserva de turno
  _precios.js      recalcula el pedido del lado del servidor
```

Los dos archivos marcados con ⭐ son los que se tocan para el día a día.

---

## Tareas frecuentes

### Cambiar el nombre de la marca

```bash
./herramientas/renombrar-marca.sh NITIDO nitido.com.ar
```

Después revisar a mano tres cosas que el script no puede adivinar:
`assets/favicon.svg`, el logotipo en `js/ui.js` (`UI.I.logo`) y los títulos de
`index.html`, que juegan con el significado de la palabra "ojo".

### Cambiar precios o agregar un modelo

Todo está en `js/catalogo.js`. Cada producto es un objeto:

```js
{
  sku: 'CE-TRACE-C1', marca: 'central', modelo: 'Trace', variante: 'C1',
  color: 'negro', colorNombre: 'Negro', tipo: 'receta', forma: 'rectangular',
  material: 'acetato', tinte: 'transparente', genero: 'unisex',
  calce: { lente: 52, puente: 18, varilla: 145 }, calceNombre: 'mediano',
  precio: 139000, precioTachado: 169000,
  relato: 'Minimalista intelectual…',
  tags: ['mas-vendido'], stock: 12, destacado: true
}
```

Las `forma`, `material` y `color` válidos están listados en el comentario de arriba del
archivo y salen de `js/marcos.js`.

### Poner fotos reales de producto

Hoy cada anteojo se **dibuja** en SVG a partir de su forma y color. Cuando haya fotos,
se agrega el campo `foto` y el sitio la usa automáticamente:

```js
{ sku: 'CE-TRACE-C1', /* … */ foto: 'assets/productos/trace-c1.jpg' }
```

Recomendado: 1200×900, fondo claro tipo piedra, el anteojo centrado.

### Cambiar precios de cristales o tratamientos

En `js/cristales.js`: `INDICES` (los cinco índices de refracción), `USOS` (recargo de
progresivo y ocupacional) y `TRATAMIENTOS`.

La recomendación automática de índice sale de `INDICES[].hasta`, que es la graduación
máxima razonable para ese índice.

### Cambiar promociones

En `js/config.js` → `PROMOS` y `CUPONES`. El motor aplica todo solo y siempre a favor
del cliente. Las promos son acumulables con los cupones, y el cupón se calcula sobre el
subtotal que ya tiene las promos aplicadas.

### Cambiar la agenda de turnos

En `js/config.js` → `TURNOS`: sedes, profesionales, tipos de consulta, días hábiles,
horarios y cuántos días para adelante se toman turnos.

### Cambiar la paleta

Las variables al inicio de `css/base.css`. Cambiando `--acento` cambia el sitio entero.

```css
--hueso:#F4EFE7;      /* fondo */
--tinta:#171310;      /* texto */
--acento:#C4552B;     /* terracota */
```

---

## Publicar

**Vercel**, como proyecto separado de la landing que ya está en la raíz del repositorio:

1. Importar el repo en vercel.com
2. **Root Directory: `optica`** ← importante
3. Framework preset: *Other*. Sin build command ni output directory.

Con eso el sitio queda en la raíz de su dominio y las funciones de `api/` responden
en `/api/…`.

**Netlify** también sirve para la parte estática, pero las funciones de `api/` habría que
portarlas a `netlify/functions/`.

---

## Activar los pagos reales

1. En [Mercado Pago → Tus integraciones](https://www.mercadopago.com.ar/developers)
   crear una aplicación y copiar las credenciales.
2. En Vercel → Settings → Environment Variables:

   | Variable | Para qué |
   |---|---|
   | `MP_ACCESS_TOKEN` | **Obligatoria.** Token privado. Nunca va en el código. |
   | `MP_WEBHOOK_SECRET` | Firma del webhook. Muy recomendada. |
   | `SITIO_URL` | Ej. `https://ojo.com.ar`. Si falta se deduce sola. |
   | `MP_MAX_CUOTAS` | Cuotas máximas. Por defecto 6. |

3. En `js/config.js` → `PAGOS`: poner `simulado: false` y cargar `mercadoPagoPublicKey`
   (esa sí es pública).
4. En Mercado Pago, configurar la URL de notificaciones: `https://tudominio/api/webhook`.

Conviene probar primero con las credenciales de **prueba** (`TEST-…`) y las tarjetas de
prueba de Mercado Pago.

> `api/checkout.js` **recalcula todos los precios contra el catálogo** antes de cobrar y
> ignora los importes que manda el navegador. Sin eso, cualquiera podría editar el pedido
> desde la consola y pagar $1.

---

## Activar el login con Google

1. En [Google Cloud Console](https://console.cloud.google.com) → APIs y servicios →
   Credenciales → *Crear credenciales* → **ID de cliente de OAuth 2.0** → Aplicación web.
2. En **Orígenes autorizados de JavaScript** agregar el dominio
   (`https://ojo.com.ar` y, para probar, `http://localhost:8000`).
3. Copiar el Client ID a dos lugares:
   - `js/config.js` → `AUTH.googleClientId`
   - Vercel → variable de entorno `GOOGLE_CLIENT_ID`
4. Poner `AUTH.simulado: false`.

`api/auth.js` verifica de verdad el token contra las claves públicas de Google (firma,
emisor, destinatario y vencimiento), sin usar ninguna librería externa.

---

## Conectar la agenda de turnos

Con `TURNOS.simulado: true` la reserva se confirma en el navegador, ofrece descargar el
`.ics` y avisar por WhatsApp — sirve perfecto para arrancar.

Para guardarlos de verdad: poner `simulado: false` y definir `TURNOS_WEBHOOK_URL`
(Airtable, Google Sheets, Zapier, n8n…). El punto de integración está marcado en
`api/turnos.js`.

> ⚠️ Mientras no haya agenda real, la disponibilidad que muestra el calendario es
> generada. Dos personas podrían reservar el mismo horario.

---

## Cómo funcionan las dos piezas menos obvias

### Los anteojos son SVG, no fotos

`js/marcos.js` dibuja un par de anteojos a partir de la forma, el material y el color:
11 formas, 24 colores (con degradés que imitan el veteado del acetato havana y la
translucidez del cristal) y 10 tintes.

La misma geometría se usa en las tarjetas del catálogo, en la ficha y en el probador.
`Marcos.PUPILAS` expone dónde están los centros ópticos dentro del dibujo, que es lo que
permite calzarlo sobre una cara.

### El probador no usa detección facial

La persona marca sus dos pupilas con un toque. Con esos dos puntos salen las tres cosas
que hacen falta, sin adivinar nada:

- **posición** → el punto medio entre las pupilas
- **escala** → la distancia entre pupilas dividida por la separación del dibujo
- **rotación** → el ángulo de la recta que las une

Por eso no hace falta ninguna librería: cero KB de descarga, anda en cualquier navegador
y **la foto nunca sale del dispositivo**.

El medidor de DP usa el mismo principio al revés: una tarjeta de crédito mide siempre
85,6 mm (norma ISO/IEC 7810), así que marcando sus dos bordes se sabe cuántos milímetros
mide cada píxel, y con eso se mide la distancia entre pupilas.

---

## Falta antes de salir a producción

- [ ] **Definir el nombre** de la marca y correr el script de renombre
- [ ] **Revisar todos los precios** de `js/catalogo.js` — hoy son verosímiles pero inventados
- [ ] **Reemplazar las marcas de ejemplo.** Central va con sus modelos y colores reales;
      `Duna`, `Seró`, `Kaio` y `Maré` son inventadas para mostrar el paraguas multimarca
      (llevan `placeholder: true`). Cambiarlas por las que realmente se distribuyan.
- [ ] **Fotos de producto** reales (ver arriba)
- [ ] **Datos de las sedes**: direcciones, profesionales y matrículas en `CONFIG.TURNOS`
- [ ] **Datos fiscales**: CUIT y razón social en `CONFIG.MARCA`
- [ ] **WhatsApp, email e Instagram** reales en `CONFIG.MARCA`
- [ ] **Credenciales** de Mercado Pago y Google
- [ ] **`og:url`, `og:image` y `<link rel="canonical">`** con el dominio definitivo
      (hay un `TODO` marcado en el `<head>` de `index.html`)
- [ ] **Términos y condiciones** y política de privacidad
- [ ] **Persistencia de pedidos**: hoy quedan en el navegador del comprador y en los logs
      de Vercel. El lugar para engancharlo está marcado en `api/webhook.js`.
- [ ] **Control de stock real**: `stock` es un número en el catálogo, no baja al vender

---

## Detalles técnicos

- Responsive desde 320 px, sin scroll horizontal en ninguna página.
- Tipografías auto-hospedadas: cero pedidos a Google Fonts.
- Respeta `prefers-reduced-motion`: si el visitante pidió menos animaciones, se apagan.
- Navegable por teclado, con foco visible en todos los controles.
- La cabecera, el pie, el cajón del carrito y los avisos se inyectan desde `js/ui.js`
  para que las nueve páginas no se desincronicen. El contenido propio de cada página sí
  está en su HTML, para que Google lo lea sin ejecutar JavaScript.
- El estado de los filtros del catálogo vive en la URL: el botón "atrás" funciona y
  cualquier búsqueda filtrada se puede compartir.
- `js/promos.js` es matemática pura y lo cargan tanto el navegador como el servidor:
  una sola implementación de los descuentos, para que el total que ve el cliente sea
  exactamente el que se le cobra.
- Datos estructurados `Product` (JSON-LD) en la ficha de producto.
