#!/usr/bin/env bash
# ============================================================
# Renombra la marca en todo el sitio.
#
#   ./herramientas/renombrar-marca.sh NITIDO
#   ./herramientas/renombrar-marca.sh NITIDO nitido.com.ar
#
# "OJO" es un nombre de trabajo. Este script lo reemplaza en el
# HTML, el CSS, el JavaScript y el README de una sola pasada.
#
# Después de correrlo conviene revisar a mano:
#   · assets/favicon.svg          (el glifo dibuja dos lentes)
#   · el logotipo en js/ui.js     (UI.I.logo)
#   · los textos donde el nombre juega con su significado
# ============================================================
set -euo pipefail

VIEJO="OJO"
NUEVO="${1:-}"
DOMINIO="${2:-}"

if [[ -z "$NUEVO" ]]; then
  echo "Uso: $0 NUEVONOMBRE [dominio.com.ar]" >&2
  echo "Ejemplo: $0 NITIDO nitido.com.ar" >&2
  exit 1
fi

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

# minúsculas, para las claves de localStorage (ojo.carrito, ojo.sesion…)
VIEJO_MIN="$(echo "$VIEJO" | tr '[:upper:]' '[:lower:]')"
NUEVO_MIN="$(echo "$NUEVO" | tr '[:upper:]' '[:lower:]')"

ARCHIVOS=$(find . -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.md' -o -name '*.json' \) \
  -not -path './node_modules/*' -not -path './.git/*')

echo "Renombrando $VIEJO → $NUEVO"

for f in $ARCHIVOS; do
  # \b evita tocar palabras que contengan el nombre por casualidad
  perl -pi -e "s/\\b\Q$VIEJO\E\\b/$NUEVO/g; s/\\b\Q$VIEJO_MIN\E\\./$NUEVO_MIN./g" "$f"
done

if [[ -n "$DOMINIO" ]]; then
  echo "Dominio → $DOMINIO"
  for f in $ARCHIVOS; do
    perl -pi -e "s/\\bojo\.com\.ar\\b/$DOMINIO/g" "$f"
  done
fi

echo
echo "Listo. Revisá a mano:"
echo "  · assets/favicon.svg      — el ícono dibuja dos lentes y un puente"
echo "  · js/ui.js (UI.I.logo)    — el logotipo es un SVG de dos lentes"
echo "  · index.html              — los títulos juegan con el significado del nombre"
echo
echo "Para verlo:  python3 -m http.server 8000"
