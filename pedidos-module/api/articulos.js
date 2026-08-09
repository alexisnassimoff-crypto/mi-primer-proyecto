// GET /api/articulos — catálogo activo + configuración de zonas en una sola respuesta.
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
    const [arts, config] = await Promise.all([
      fetchAll("ARTICULOS", "&filterByFormula=" + encodeURIComponent("{Activo}=TRUE()")),
      fetchAll("CONFIG"),
    ]);

    const articulos = arts
      .map((r) => ({
        id: r.id,
        modelo: String(r.fields.Modelo || "").toUpperCase().trim(),
        linea: String(r.fields.Linea || "").trim(),
        colores: String(r.fields.Colores || "")
          .split(",").map((c) => c.trim().toUpperCase()).filter(Boolean),
        precio1: r.fields.PrecioLista1 || 0,
        precio2: r.fields.PrecioLista2 || r.fields.PrecioLista1 || 0,
        orden: r.fields.Orden ?? 9999,
      }))
      .filter((a) => a.modelo)
      .sort((a, b) => a.orden - b.orden || a.modelo.localeCompare(b.modelo));

    const listaProvincia = {};
    let listaDefault = 1;
    for (const r of config) {
      const clave = String(r.fields.Clave || "").trim();
      const valor = parseInt(r.fields.Valor, 10);
      if (!clave || (valor !== 1 && valor !== 2)) continue;
      if (clave === "lista_default") listaDefault = valor;
      else if (clave.startsWith("lista_provincia:"))
        listaProvincia[clave.slice("lista_provincia:".length).toUpperCase().trim()] = valor;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).json({
      articulos,
      config: { listaDefault, listaProvincia },
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
