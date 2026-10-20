# Pendientes — cómo usar lo nuevo

## Dieta (nuevo)

La app de la dieta está en **https://pendientes-ale.vercel.app/dieta/**. Para tenerla como app en
el iPhone: abrila en Safari → Compartir → «Agregar a inicio». Queda con su propio ícono (una
estrella verde).

1. **Cargá cada comida.** Tocá «Cargar» al lado de la comida y escribí qué comiste (o dictalo
   con el micrófono del teclado). Con la IA conectada, tocás **Listo** y la app ve sola cómo
   cuenta en el plan; el aviso te lo dice y tiene «Cambiar» por si no estás de acuerdo. Sin IA,
   tocás cómo fue y queda guardada. Abajo del texto aparece lo que cargaste otras veces: un toque
   y listo. Si te equivocaste, tocá la comida y corregila (o borrala). Para un día anterior:
   Historial → ese día → Cargar.
2. **La estrella.** Cuando desayuno, almuerzo y cena están cargados y dentro del plan (y no hubo
   extras), el día gana la estrella. Si te tentaste, cargalo igual en «Anotar un extra»: la app es
   honesta, no te reta.
3. **Los cupos.** Almuerzo: 1 con carbo y 1 libre por semana. Cena: 1 con carbo y 2 libres. Se ven
   en Hoy, en «Esta semana». Si ya usaste el cupo, la app te avisa antes de guardar.
4. **Peso.** Como en el mes no te pesás, Hoy solo muestra la fecha del pesaje. Cuando llegue, está
   en Ajustes → Peso.
5. **¿Qué como?** Ideas dentro del plan para la comida que toca.
6. **Para la IA (ideas con lo que tengas en la heladera, «¿Esto va?» y preguntas):** Ajustes →
   Respaldo e IA → escribí **la misma clave que usás en Pendientes** → Conectar. Una sola vez. Con
   eso, además, todo queda guardado en Airtable (tablas Comidas y Peso) por si cambiás de teléfono.

Todo está publicado y andando en https://pendientes-ale.vercel.app. No queda nada por hacer de tu
lado: la clave de la IA ya está puesta en Vercel.

Si algo de la IA no aparece, cerrá la app del todo y volvé a abrirla (se actualiza sola).

## Lo que hace la IA

1. **Varias cosas de una.** En Nuevo (o con el micrófono) decí todo junto: *«llamar al contador
   mañana a las 10, pagar el ABL 12 mil y comprar alimento del perro»*. Tocá **Siguiente**: la app
   te muestra las tres separadas, cada una en su tema. Destildá la que no va y tocá **Guardar**.
2. **Leer una foto, una captura o un PDF.** En Nuevo: **Leer una foto, captura o PDF**. Sirve para
   la boleta de la luz, una captura de WhatsApp («¿cenamos el jueves a las 21?»), la circular del
   colegio o un turno médico. Si hay una sola cosa, queda armada en el formulario; si hay varias
   (por ejemplo, una circular con tres fechas), las revisás y las guardás de una.
3. **Facturas en PDF.** Las boletas que te llegan por mail en PDF se leen igual que las fotos
   (hasta 3 MB): mismo botón.
4. **Preguntale a tu agenda.** En Inicio, **Preguntale a tu agenda**: *«¿qué tengo mañana?»*,
   *«¿cuánto gasté este mes?»*, *«¿qué está atrasado?»*. Contesta con tus datos.
5. **El resumen del día.** Cada mañana, arriba de todo en Inicio, «Para hoy»: qué tenés, qué
   conviene hacer primero y qué pago no se te puede pasar. También va en el aviso de la mañana del
   Calendario. **Actualizar** lo vuelve a armar si agregaste cosas.
6. **Mensajes de WhatsApp.** En la ficha de un pendiente con fecha: **Invitar a alguien → Escribir
   el mensaje**. Si querés, escribí arriba qué decir («que traiga vino»). Lo podés cambiar y
   después **Mandar por WhatsApp**. **Otra versión** escribe uno nuevo.

Sin internet la app anda igual que siempre; la IA vuelve cuando hay conexión.

## Lo de antes, que sigue andando

- **Dictar:** el micrófono de arriba abre Nuevo con el teclado. Tocá el **micrófono del teclado**
  y hablá. Si no lo ves: Ajustes del iPhone → General → Teclado → **Dictado**.
- **Resumen de la mañana en el Calendario:** a las 8 te llega un aviso «Hoy: …». Se cambia la hora
  (o se apaga) en Ajustes → Calendario del iPhone → Resumen de la mañana. Si no suena, en el
  Calendario entrá a la suscripción y apagá «Eliminar alarmas».
- **Gastos del mes:** cuando tildás un pendiente con monto, queda anotado como pagado. En Inicio,
  «Gastos de octubre» muestra cuánto pagaste y cuánto falta.
- **Posponer:** en la ficha de un pendiente, «Pasar a mañana», «Al lunes» o «Una semana más».
- **Mandar la lista:** dentro de un tema, «Mandar la lista» la manda por WhatsApp.

## Cuánto cuesta la IA

Se paga por uso en https://console.anthropic.com: leer una foto o contestar una pregunta cuesta
unos centavos de dólar, y el resumen del día se arma una sola vez por día. Si querés un tope por
mes: console.anthropic.com → **Settings → Limits**.
