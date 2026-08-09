// Endpoint llamado al hacer login — manda mail si hay alertas vencidas o que vencen hoy
const nodemailer = require("nodemailer");

const VENDEDOR_MAILS = {
matias:  "matias@centraleyewear.com",   // reemplazar con mails reales
miguel:  "miguel@centraleyewear.com",
nicolas: "nicolas@centraleyewear.com",
mauro:   "mauro@centraleyewear.com",
central: "pedidosfocusvision@gmail.com",
ale:     "pedidosfocusvision@gmail.com",
};

export default async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
if (req.method === "OPTIONS") return res.status(200).end();
if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

try {
const { username, nombre, alertas } = req.body;
// alertas: [{ texto, fecha, clienteNombre }]

```
if (!alertas || alertas.length === 0) return res.json({ ok: true, enviado: false });

const mail = VENDEDOR_MAILS[username];
if (!mail) return res.json({ ok: true, enviado: false, razon: "sin mail configurado" });

const hoy = new Date().toISOString().slice(0,10);
const fmtFecha = f => {
  const [y,m,d] = f.split("-");
  return `${d}/${m}/${y}`;
};

const filas = alertas.map(a => {
  const vencida = a.fecha < hoy;
  return `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:10px 14px;font-size:13px">${a.clienteNombre}</td>
      <td style="padding:10px 14px;font-size:13px">${a.texto}</td>
      <td style="padding:10px 14px;font-size:12px;color:${vencida?"#c00":"#c17f4a"};font-weight:700">${vencida ? `Vencida (${fmtFecha(a.fecha)})` : "Hoy"}</td>
    </tr>`;
}).join("");

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;color:#111;padding:32px;max-width:600px;margin:0 auto">
  <h2 style="font-size:22px;font-weight:700;letter-spacing:4px;margin-bottom:4px">CENTRAL</h2>
  <p style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:32px">your style, our passion</p>
  <h3 style="margin-bottom:8px">Hola ${nombre},</h3>
  <p style="color:#555;font-size:14px;margin-bottom:24px">Tenés ${alertas.length === 1 ? "1 alerta urgente" : `${alertas.length} alertas urgentes`} para atender hoy:</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#111;color:#fff">
        <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px">Cliente</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px">Alerta</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px">Estado</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <p style="font-size:12px;color:#888">Ingresá al CRM para marcarlas como resueltas.</p>
  <p style="font-size:12px;color:#aaa;margin-top:24px">Central Eyewear · pedidosfocusvision@gmail.com</p>
</body></html>`;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

await transporter.sendMail({
  from: `"Central Eyewear CRM" <${process.env.GMAIL_USER}>`,
  to: mail,
  subject: `🔔 ${alertas.length === 1 ? "1 alerta urgente" : `${alertas.length} alertas urgentes`} — Central Eyewear`,
  html,
});

return res.json({ ok: true, enviado: true, mail });
```

} catch (e) {
console.error("alertas-mail error:", e);
return res.status(500).json({ error: e.message });
}
}
