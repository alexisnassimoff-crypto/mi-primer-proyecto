"""
Prepara las imágenes de la web a partir de los originales.

  1. Retrato: detecta el círculo de la foto de perfil, lo recorta y lo guarda
     como WebP con fondo transparente.
  2. Casos: recorta la cabecera y la interfaz de Instagram de las capturas
     antes/después y deja sólo el par de fotos.

Uso:  pip install pillow numpy && python3 herramientas/procesar-imagenes.py
Ajustá U (carpeta de originales) y OUT (carpeta assets/) antes de correrlo.
"""
from PIL import Image, ImageDraw
import numpy as np

U = '/root/.claude/uploads/16de03f9-2c04-5cf7-81bf-7660cc35b681/'
OUT = '/home/user/mi-primer-proyecto/assets/'

# ---------- 1. Retrato circular ----------
im = Image.open(U+'f1b0d327-FullSizeRender.jpeg').convert('RGB')
a = np.asarray(im).astype(int)
bg = a[5, 5]
dif = (np.abs(a - bg).sum(2) > 40)
ys, xs = np.where(dif)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max()+1, ys.max()+1
lado = min(x1-x0, y1-y0)
cx, cy = (x0+x1)//2, (y0+y1)//2
caja = (cx-lado//2, cy-lado//2, cx+lado//2, cy+lado//2)
rec = im.crop(caja).resize((760, 760), Image.LANCZOS)

# máscara circular con borde suave (4x para antialias)
S = 760
m = Image.new('L', (S*4, S*4), 0)
ImageDraw.Draw(m).ellipse((0, 0, S*4-1, S*4-1), fill=255)
m = m.resize((S, S), Image.LANCZOS)
ret = rec.convert('RGBA'); ret.putalpha(m)
ret.save(OUT+'uriel.webp', 'WEBP', quality=88, method=6)
print('uriel.webp', ret.size, round(len(open(OUT+'uriel.webp','rb').read())/1024), 'KB · recorte', caja)

# ---------- 2. Casos antes/después ----------
casos = [
    ('6e969d17-IMG_1107.jpeg', 'caso1-frente'),
    ('ecd1b164-IMG_1106.jpeg', 'caso1-tres-cuartos'),
    ('6b7d0ffa-IMG_1108.jpeg', 'caso1-perfil'),
]
for archivo, nombre in casos:
    im = Image.open(U+archivo).convert('RGB')
    g = np.asarray(im.convert('L')).astype(float)
    H, W = g.shape

    # arriba: primera fila (bajo la cabecera) con contenido fotográfico sostenido
    top = 240
    for y in range(240, H//2):
        if np.percentile(g[y], 90) > 45 and np.percentile(g[y+15], 90) > 45:
            top = y; break

    # abajo: el botón de silencio de Instagram vive en la esquina inferior derecha
    bot = H
    esq = g[H-260:, int(W*0.82):]
    filas = np.percentile(esq, 97, axis=1)
    idx = np.where(filas > 33)[0]
    if len(idx):
        bot = H - 260 + idx.min() - 12

    rec = im.crop((0, top, W, bot))
    w, h = rec.size
    rec = rec.resize((900, round(900*h/w)), Image.LANCZOS)
    rec.save(OUT+'casos/'+nombre+'.jpg', 'JPEG', quality=84, optimize=True, progressive=True)
    kb = round(len(open(OUT+'casos/'+nombre+'.jpg','rb').read())/1024)
    print(f'{nombre}.jpg  {rec.size}  {kb} KB   (recorte y {top}→{bot} de {H})')
