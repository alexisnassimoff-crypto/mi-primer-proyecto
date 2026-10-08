# Pendientes — lo que queda de tu lado

Todo lo nuevo ya está publicado y andando en https://pendientes-ale.vercel.app. Hay dos cosas
que solo podés hacer vos, una sola vez cada una. Ninguna lleva más de 5 minutos.

## 1. El atajo de Siri (para anotar sin abrir la app)

Con esto le decís «Oye Siri, anotar pendiente», le contás qué y queda anotado con su aviso.
Y desde WhatsApp, un mensaje → Compartir → «Anotar pendiente».

1. En Pendientes, andá a **Ajustes → Anotar con Siri o desde WhatsApp** y tocá
   **Copiar el link para el atajo**.
2. Abrí la app **Atajos** del iPhone y tocá **+** (arriba a la derecha).
3. Tocá el nombre de arriba («Nuevo atajo») y ponele **Anotar pendiente**.
4. Tocá **Añadir acción**, buscá **Recibir entrada de la hoja de compartir** y agregala.
   Dentro de esa acción, en «Si no hay entrada» elegí **Pedir texto**, y en la pregunta escribí
   **¿Qué anoto?**
5. Tocá **Añadir acción**, buscá **Obtener contenido de URL** y agregala. Pegá ahí el link que
   copiaste. Tocá la flechita de esa acción para ver más opciones:
   - **Método: POST**
   - **Cuerpo de la solicitud: Formulario**
   - **Añadir nuevo campo → Texto**. Como nombre (clave) escribí **texto** y como valor elegí la
     variable **Entrada del atajo**.
6. Tocá **Añadir acción**, buscá **Mostrar resultado** y agregala (ya va a decir «Contenido de
   URL»).
7. Tocá el botón de información (ⓘ) de abajo y prendé **Mostrar en la hoja de compartir**.
8. Tocá **OK**. Listo.

Probalo: «Oye Siri, anotar pendiente». Siri te pregunta «¿Qué anoto?», le decís por ejemplo
*«pagar la luz el viernes 35 mil»* y te contesta «Anotado en Gastos de la casa: Pagar la luz, el
viernes 9 de octubre. Aviso el día anterior a las 9. $ 35.000». Al rato aparece en la app y en el
Calendario.

Desde WhatsApp: mantené apretado un mensaje → **Reenviar** o **Compartir** → buscá **Anotar
pendiente** en la lista de atajos.

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
