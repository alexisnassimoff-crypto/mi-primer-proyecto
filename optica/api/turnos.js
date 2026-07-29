/* ============================================================
   POST /api/turnos
   ------------------------------------------------------------
   Recibe una reserva de turno, la valida y la deja registrada.

   Hoy sólo escribe en los logs de Vercel y, si está configurado,
   la reenvía a un webhook (Airtable, Google Sheets, Zapier, n8n,
   lo que se use para la agenda). El punto de integración está
   marcado abajo.

   Variables de entorno (todas opcionales):
     TURNOS_WEBHOOK_URL     a dónde reenviar la reserva
     TURNOS_WEBHOOK_TOKEN   se manda como Authorization: Bearer
   ============================================================ */

const CONFIG = require('../js/config.js');

const OBLIGATORIOS = ['sede', 'tipo', 'fecha', 'hora', 'nombre', 'telefono', 'email'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  let turno = req.body;
  if (typeof turno === 'string') {
    try { turno = JSON.parse(turno); } catch (e) {
      return res.status(400).json({ error: 'No pudimos leer la reserva.' });
    }
  }
  turno = turno || {};

  /* ---- Validación ---- */
  const faltantes = OBLIGATORIOS.filter((c) => !String(turno[c] || '').trim());
  if (faltantes.length) {
    return res.status(400).json({ error: `Faltan datos: ${faltantes.join(', ')}.` });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(turno.email)) {
    return res.status(400).json({ error: 'El email no es válido.' });
  }

  const sede = CONFIG.TURNOS.sedes.find((s) => s.id === turno.sede);
  if (!sede) return res.status(400).json({ error: 'Esa sede no existe.' });

  const tipo = CONFIG.TURNOS.tipos.find((t) => t.id === turno.tipo);
  if (!tipo) return res.status(400).json({ error: 'Ese tipo de consulta no existe.' });

  const fecha = new Date(turno.fecha);
  if (isNaN(fecha.getTime())) return res.status(400).json({ error: 'La fecha no es válida.' });

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (fecha < hoy) return res.status(400).json({ error: 'Esa fecha ya pasó.' });

  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + CONFIG.TURNOS.diasAnticipacion);
  if (fecha > limite) {
    return res.status(400).json({ error: `Sólo tomamos turnos hasta ${CONFIG.TURNOS.diasAnticipacion} días adelante.` });
  }

  if (!CONFIG.TURNOS.diasHabiles.includes(fecha.getDay())) {
    return res.status(400).json({ error: 'Ese día no atendemos.' });
  }

  const horarios = fecha.getDay() === 6 ? CONFIG.TURNOS.horarios.sabado : CONFIG.TURNOS.horarios.semana;
  if (!horarios.includes(turno.hora)) {
    return res.status(400).json({ error: 'Ese horario no está en la agenda.' });
  }

  /* ---- Registro ---- */
  const registro = {
    numero: turno.numero || nuevoNumero(),
    creado: new Date().toISOString(),
    sede: sede.id,
    sedeNombre: sede.nombre,
    profesional: sede.profesional,
    tipo: tipo.id,
    tipoNombre: tipo.nombre,
    fecha: fecha.toISOString(),
    hora: turno.hora,
    paciente: {
      nombre: String(turno.nombre).trim().slice(0, 120),
      telefono: String(turno.telefono).trim().slice(0, 40),
      email: String(turno.email).trim().slice(0, 160),
      comentario: String(turno.comentario || '').trim().slice(0, 600)
    }
  };

  console.log('Turno reservado:', JSON.stringify(registro));

  /* ============================================================
     ACÁ VA LA AGENDA DE VERDAD
     ------------------------------------------------------------
     Sin backend no hay forma de saber si el horario sigue libre:
     dos personas podrían reservar el mismo turno. Cuando se
     conecte una agenda real, este es el lugar para:
       · chequear disponibilidad y bloquear el horario
       · crear el evento en Google Calendar del profesional
       · mandar el mail de confirmación al paciente
     ============================================================ */

  const url = process.env.TURNOS_WEBHOOK_URL;
  if (url) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.TURNOS_WEBHOOK_TOKEN) {
        headers.Authorization = `Bearer ${process.env.TURNOS_WEBHOOK_TOKEN}`;
      }
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(registro) });
      if (!r.ok) console.error('turnos: el webhook respondió', r.status);
    } catch (err) {
      // Que falle la integración no debería tirar abajo la reserva:
      // el turno igual queda en los logs y se recupera a mano.
      console.error('turnos: no pudimos avisar al webhook', err);
    }
  }

  return res.status(200).json({ ok: true, numero: registro.numero });
};

function nuevoNumero() {
  return 'T-' + Date.now().toString(36).slice(-5).toUpperCase();
}
