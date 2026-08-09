# Nota de Pedido Digital — Central Eyewear (módulo en preparación)

Código del sistema de pedidos digital para los vendedores, **destinado al repo
`central-eyewear-crm`**. Vive acá temporalmente hasta que se apruebe el acceso a
ese repo en la sesión de Claude. No forma parte de la landing de este repo.

## Qué hay

| Archivo | Qué es |
|---|---|
| `api/articulos.js` | `GET /api/articulos` — catálogo activo + config de zonas, cache CDN 5 min |
| `api/pedidos.js` | CRUD de pedidos + `action:"enviar"`: revalida precios, genera PDF, manda mail vía Gmail, marca enviado y refleja en `CRM_Data.pedidos[]` |
| `api/_pdf-nota.js` | Generador del PDF (pdf-lib) — letra grande, multipágina |
| `frontend/pedidos-components.jsx` | Wizard `NuevoPedidoDigital` (artículos → cliente → revisión → envío) + `ListaPedidos`, con notas de integración en `app.jsx` al final del archivo |
| `test-pdf.js` | Genera `nota-pedido-muestra.pdf` con un pedido real de 44 renglones |
| `nota-pedido-muestra.pdf` | Vista previa del PDF que llega por mail |

## Pendiente para activarlo

1. **Aprobar acceso** al repo `central-eyewear-crm` (add_repo) → mover `api/*` a `/api`, pegar los componentes en `public/app.jsx` siguiendo las notas de integración, agregar `listaPrecio` a `CRM_KEYS` en `api/crm.js`, sumar `pdf-lib` y `nodemailer` a `package.json`.
2. **Aprobar escrituras en Airtable** → crear tablas `ARTICULOS`, `PEDIDOS`, `CONFIG` (esquemas en el plan) e importar la planilla de artículos de Ale.
3. **Ale entrega**: planilla del catálogo (modelo, línea, colores, precio lista 1 y 2), provincias/zonas de Lista 2, contraseña de aplicación de Google para pedidosfocusvision@gmail.com, logo PNG + colores de centraleyewear.com.
4. **Vercel env vars**: `GMAIL_USER`, `GMAIL_APP_PASSWORD`.

Probar localmente: `npm install pdf-lib && node test-pdf.js`
