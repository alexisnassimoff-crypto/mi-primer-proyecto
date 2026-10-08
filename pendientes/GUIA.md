# Pendientes — lo que queda de tu lado

Todo lo nuevo ya está publicado y andando en https://pendientes-ale.vercel.app. Hay una sola
cosa que queda de tu lado (la clave para leer facturas, 5 minutos) y es opcional.

## 1. Dictar un pendiente (ya anda, no hay que armar nada)

Arriba de la app hay un **micrófono**. «Oye Siri, abrí Pendientes», tocás el micrófono y hablás:
*«pagar la luz el viernes, 35 mil»*. Lo entendido aparece en el formulario y con **Guardar** queda,
con su aviso y en el Calendario. La primera vez el iPhone te pide permiso para usar el micrófono:
tocá **Permitir**. Si lo negaste sin querer: Ajustes del iPhone → Safari → Micrófono → Permitir.

Para que Siri abra la app por su nombre, tiene que estar en la pantalla de inicio: en Safari,
Compartir → **Agregar a inicio**.

(Opcional, para los que quieran anotar sin abrir la app: el atajo de Siri. En Pendientes → Ajustes →
**Anotar con Siri o desde WhatsApp** están el link y los pasos. No hace falta.)

## 2. La clave para leer facturas con una foto

En **Nuevo** hay un botón **Leer una factura con la cámara**: le sacás una foto a la boleta de luz,
gas, expensas o lo que sea, y la app arma sola «Pagar Edenor octubre 2026 · $35.420 · vence el 15»,
con aviso dos días antes. Para eso la app usa Claude, y necesita una clave:

1. Entrá a https://console.anthropic.com e iniciá sesión (si no tenés cuenta, crearla es gratis;
   después se paga por uso: leer una factura cuesta unos centavos de dólar).
2. En el menú, **API Keys → Create Key**. Ponele un nombre («Pendientes») y copiá la clave
   (empieza con `sk-ant-`). Se muestra una sola vez.
3. Entrá a https://vercel.com → proyecto **pendientes-ale** → **Settings → Environment
   Variables**.
4. Tocá **Add New**. Key: `ANTHROPIC_API_KEY`. Value: la clave que copiaste. Dejá marcados los
   tres entornos y tocá **Save**.
5. Andá a **Deployments**, tocá los tres puntitos del último y **Redeploy**. Esperá un minuto.

Probalo: Nuevo → **Leer una factura con la cámara** → sacale una foto a cualquier boleta.

Si no querés usarlo, no hagas nada: el botón te avisa que falta la clave y todo lo demás anda igual.

## 3. Lo que ya está andando solo

- **Resumen de la mañana:** mañana a las 8 te llega un aviso del Calendario «Hoy: …» con lo del
  día, lo atrasado y lo que vence en la semana. Se cambia la hora (o se apaga) en Ajustes →
  Calendario del iPhone → Resumen de la mañana. Si no suena, en el Calendario entrá a la
  suscripción y apagá «Eliminar alarmas».
- **Gastos del mes:** cuando tildás un pendiente con monto (por ejemplo «Pagar expensas
  $185.000»), queda anotado como pagado. En Inicio aparece «Gastos de octubre» y tocándolo ves
  cuánto pagaste, cuánto falta y la lista. También podés anotar un gasto ya pagado desde ahí.
- **Posponer:** en la ficha de un pendiente, «Pasar a mañana», «Al lunes» o «Una semana más».
- **Mandar la lista:** dentro de un tema (por ejemplo Compras de la casa), «Mandar la lista» se la
  manda a quien quieras por WhatsApp.
