// GET /api/articulos — catálogo agrupado por modelo + configuración, en una sola respuesta.
// Cache CDN 5 min (protege el límite de 5 req/s de Airtable); el front cachea además en localStorage.
const BASE = process.env.AIRTABLE_BASE;
const TOKEN = process.env.AIRTABLE_TOKEN;
const API = `https://api.airtable.com/v0/${BASE}`;
const H = { Authorization: `Bearer ${TOKEN}` };

async function fetchAll(tabla, params = "") {
  let records = [], offset = "";
  do {
    const url = `${API}/${encodeURIComponent(tabla)}?pageSize=100${params}${offset ? `&offset=${offset}` : ""}`;
    const r = await fetch(url, { headers: H });
    if (!r.ok) throw new Error(`Airtable ${tabla}: ${r.status} ${await r.text()}`);
    const j = await r.json();
    records = records.concat(j.records || []);
    offset = j.offset || "";
  } while (offset);
  return records;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  try {
    const [arts, configRecs] = await Promise.all([
      fetchAll("ARTICULOS", "&filterByFormula=" + encodeURIComponent("NOT({Inactivo})")),
      fetchAll("CONFIG"),
    ]);

    // Agrupar por marca+modelo → un modelo con su lista de colores (cada color con sus dos precios)
    const porModelo = new Map();
    for (const r of arts) {
      const f = r.fields;
      const marca = String(f.Marca || "").toUpperCase().trim();
      const modelo = String(f.Modelo || "").toUpperCase().trim();
      if (!modelo) continue;
      const key = marca + "|" + modelo;
      if (!porModelo.has(key)) porModelo.set(key, { marca, modelo, colores: [] });
      porModelo.get(key).colores.push({
        codigo: f.Codigo || "",
        color: String(f.Color || "").toUpperCase().trim(),
        coniva: f.PrecioConIva || 0,
        siniva: f.PrecioSinIva || 0,
      });
    }
    const modelos = Array.from(porModelo.values());
    for (const m of modelos)
      m.colores.sort((a, b) =>
        a.color.localeCompare(b.color, undefined, { numeric: true }));
    modelos.sort((a, b) =>
      (a.marca === "CENTRAL" ? 0 : 1) - (b.marca === "CENTRAL" ? 0 : 1) ||
      a.modelo.localeCompare(b.modelo));

    // CONFIG: iva_default (siniva|coniva), recargo_provincia:<PROV> = monto por unidad
    const config = { ivaDefault: "siniva", recargoProvincia: {} };
    for (const r of configRecs) {
      const clave = String(r.fields.Clave || "").trim();
      const valor = String(r.fields.Valor || "").trim();
      if (clave === "iva_default" && (valor === "siniva" || valor === "coniva")) config.ivaDefault = valor;
      else if (clave.startsWith("recargo_provincia:")) {
        const monto = parseInt(valor, 10);
        if (monto) config.recargoProvincia[clave.slice("recargo_provincia:".length).toUpperCase().trim()] = monto;
      }
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).json({ modelos, config, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
