/* ============================================================
   OJO — Catálogo
   ------------------------------------------------------------
   Fuente única de productos. Para editar precios, stock o sumar
   modelos, se toca únicamente este archivo.

   MARCAS
     · CENTRAL — marca de la casa. Modelos y colores REALES.
     · DUNA · SERÓ · KAIO · MARÉ — marcas socias de ejemplo, para que
       el paraguas multimarca se vea completo. Llevan `placeholder:true`
       y hay que reemplazarlas por las marcas reales que se distribuyan.

   FOTOS
     Hoy cada producto se dibuja en SVG con js/marcos.js. Cuando haya
     fotos reales, agregar `foto:'assets/productos/xxx.jpg'` a la ficha:
     el sitio la usa automáticamente y deja de dibujar el vectorial.

   CAMPOS
     forma     redondo ovalado panto cuadrado rectangular octagonal
               hexagonal cateye mariposa aviador browline
     material  acetato inyectado tr90 mixto metal titanio acero
     color     ver Marcos.COLORES
     tinte     ver Marcos.TINTES (los de receta van 'transparente')
     calce     medidas en mm — ancho de lente / puente / varilla
   ============================================================ */
(function (global) {
  'use strict';

  var MARCAS = [
    {
      id: 'central',
      nombre: 'Central',
      nombreLargo: 'Central Eyewear',
      relato: 'La marca de la casa. Curaduría propia, acetato italiano y una obsesión con la línea.',
      destacada: true
    },
    {
      id: 'duna',
      nombre: 'Duna',
      nombreLargo: 'Duna',
      relato: 'Acetato cálido y formas redondeadas. Mediterráneo sin disfraz.',
      placeholder: true
    },
    {
      id: 'sero',
      nombre: 'Seró',
      nombreLargo: 'Seró',
      relato: 'Titanio, metal y nada más. Para los que quieren no sentir el anteojo.',
      placeholder: true
    },
    {
      id: 'kaio',
      nombre: 'Kaio',
      nombreLargo: 'Kaio',
      relato: 'Urbano, liviano, resistente. El que aguanta la semana entera.',
      placeholder: true
    },
    {
      id: 'mare',
      nombre: 'Maré',
      nombreLargo: 'Maré',
      relato: 'Femenina y editorial. Formas que se ven desde la vereda de enfrente.',
      placeholder: true
    }
  ];

  /* ---------- Productos ---------- */
  var P = [
    /* ===== CENTRAL — receta ===== */
    {
      sku: 'CE-TRACE-C1', marca: 'central', modelo: 'Trace', variante: 'C1',
      color: 'negro', colorNombre: 'Negro', tipo: 'receta', forma: 'rectangular',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 52, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 139000, precioTachado: 169000,
      relato: 'Minimalista intelectual. La línea más limpia del catálogo: no sobra un milímetro.',
      tags: ['mas-vendido', 'liviano'], stock: 12, destacado: true
    },
    {
      sku: 'CE-CORE-C1', marca: 'central', modelo: 'Core', variante: 'C1',
      color: 'negro-mate', colorNombre: 'Negro mate', tipo: 'receta', forma: 'hexagonal',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 51, puente: 20, varilla: 145 }, calceNombre: 'mediano',
      precio: 149000,
      relato: 'Arquitectónico al máximo. Hexagonal, negro total, sin una concesión.',
      tags: ['nuevo'], stock: 8, destacado: true, nuevo: true
    },
    {
      sku: 'CE-CORE-C2', marca: 'central', modelo: 'Core', variante: 'C2',
      color: 'havana', colorNombre: 'Havana', tipo: 'receta', forma: 'hexagonal',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 51, puente: 20, varilla: 145 }, calceNombre: 'mediano',
      precio: 149000,
      relato: 'El mismo hexágono, en acetato tortoise premium. Textura rica, veteado profundo.',
      tags: [], stock: 10, nuevo: true
    },
    {
      sku: 'CE-CORE-C4', marca: 'central', modelo: 'Core', variante: 'C4',
      color: 'cristal-rosa', colorNombre: 'Rosa nude', tipo: 'receta', forma: 'hexagonal',
      material: 'acetato', tinte: 'transparente', genero: 'mujer',
      calce: { lente: 50, puente: 20, varilla: 145 }, calceNombre: 'chico',
      precio: 149000,
      relato: 'Translúcido rosa nude. Editorial sin gritar.',
      tags: [], stock: 6
    },
    {
      sku: 'CE-CORE-C5', marca: 'central', modelo: 'Core', variante: 'C5',
      color: 'cristal', colorNombre: 'Cristal', tipo: 'receta', forma: 'hexagonal',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 51, puente: 20, varilla: 145 }, calceNombre: 'mediano',
      precio: 149000,
      relato: 'Frente casi invisible, varillas cálidas. El truco es que no se vea el truco.',
      tags: [], stock: 7
    },
    {
      sku: 'CE-BRIO-C1', marca: 'central', modelo: 'Brio', variante: 'C1',
      color: 'negro', colorNombre: 'Negro', tipo: 'receta', forma: 'cuadrado',
      material: 'acetato', tinte: 'transparente', genero: 'hombre',
      calce: { lente: 54, puente: 18, varilla: 148 }, calceNombre: 'grande',
      precio: 129000,
      relato: 'Cuadrado clásico en negro sólido. El que nunca falla.',
      tags: ['mas-vendido'], stock: 15
    },
    {
      sku: 'CE-BRIO-C2', marca: 'central', modelo: 'Brio', variante: 'C2',
      color: 'havana', colorNombre: 'Havana ámbar', tipo: 'receta', forma: 'cuadrado',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 148 }, calceNombre: 'grande',
      precio: 129000,
      relato: 'Tortoise marrón y ámbar, del clásico de verdad.',
      tags: [], stock: 11
    },
    {
      sku: 'CE-BRIO-C3', marca: 'central', modelo: 'Brio', variante: 'C3',
      color: 'havana-azul', colorNombre: 'Havana azul', tipo: 'receta', forma: 'cuadrado',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 148 }, calceNombre: 'grande',
      precio: 135000,
      relato: 'Havana azul-verde con destellos dorados. El color más difícil de conseguir.',
      tags: ['edicion-limitada'], stock: 4
    },
    {
      sku: 'CE-BRIO-C4', marca: 'central', modelo: 'Brio', variante: 'C4',
      color: 'cristal-azul', colorNombre: 'Azul cristal', tipo: 'receta', forma: 'cuadrado',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 148 }, calceNombre: 'grande',
      precio: 129000,
      relato: 'Azul transparente con grabado geométrico en la varilla.',
      tags: [], stock: 9
    },
    {
      sku: 'CE-BRIO-C5', marca: 'central', modelo: 'Brio', variante: 'C5',
      color: 'cristal-gris', colorNombre: 'Gris y havana', tipo: 'receta', forma: 'cuadrado',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 148 }, calceNombre: 'grande',
      precio: 129000,
      relato: 'Bicolor: frente gris transparente, varillas tortoise cálido.',
      tags: [], stock: 8
    },
    {
      sku: 'CE-CENX-C2', marca: 'central', modelo: 'Cenx', variante: 'C2',
      color: 'cristal', colorNombre: 'Cristal total', tipo: 'receta', forma: 'panto',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 50, puente: 21, varilla: 145 }, calceNombre: 'mediano',
      precio: 145000,
      relato: 'Transparencia máxima. Se ve la textura de lo que tenés atrás.',
      tags: ['nuevo'], stock: 10, nuevo: true
    },
    {
      sku: 'CE-CENX-C3', marca: 'central', modelo: 'Cenx', variante: 'C3',
      color: 'champagne', colorNombre: 'Champagne', tipo: 'receta', forma: 'panto',
      material: 'acetato', tinte: 'transparente', genero: 'mujer',
      calce: { lente: 50, puente: 21, varilla: 145 }, calceNombre: 'chico',
      precio: 145000,
      relato: 'Champagne rosado. El más femenino del catálogo y el que más se lleva.',
      tags: ['mas-vendido'], stock: 13, destacado: true
    },
    {
      sku: 'CE-CENX-C4', marca: 'central', modelo: 'Cenx', variante: 'C4',
      color: 'oliva', colorNombre: 'Verde oliva', tipo: 'receta', forma: 'panto',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 50, puente: 21, varilla: 145 }, calceNombre: 'mediano',
      precio: 145000,
      relato: 'Verde oliva mediterráneo. Combina con todo y no se parece a nada.',
      tags: [], stock: 7
    },
    {
      sku: 'CE-GHOST-C1', marca: 'central', modelo: 'Ghost', variante: 'C1',
      color: 'plateado', colorNombre: 'Plata', tipo: 'receta', forma: 'cuadrado',
      material: 'metal', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 53, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 155000,
      relato: 'Metal pulido con la bisagra a la vista. El hardware es el protagonista.',
      tags: ['liviano'], stock: 9
    },
    {
      sku: 'CE-GHOST-C3', marca: 'central', modelo: 'Ghost', variante: 'C3',
      color: 'gunmetal', colorNombre: 'Gunmetal', tipo: 'receta', forma: 'cuadrado',
      material: 'metal', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 53, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 155000,
      relato: 'Etéreo: aro finísimo en gunmetal, casi desaparece en la cara.',
      tags: ['liviano'], stock: 6
    },
    {
      sku: 'CE-GHOST-C5', marca: 'central', modelo: 'Ghost', variante: 'C5',
      color: 'cristal-azul', colorNombre: 'Azul denim', tipo: 'receta', forma: 'cuadrado',
      material: 'mixto', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 53, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 159000,
      relato: 'Azul denim cálido, metal y acetato en la misma pieza.',
      tags: [], stock: 5
    },
    {
      sku: 'CE-FUSE-C2', marca: 'central', modelo: 'Fuse', variante: 'C2',
      color: 'vino', colorNombre: 'Negro y vino', tipo: 'receta', forma: 'rectangular',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 52, puente: 19, varilla: 145 }, calceNombre: 'mediano',
      precio: 139000,
      relato: 'Negro por fuera, rojo vino por dentro. El pop de color que no esperabas.',
      tags: ['edicion-limitada'], stock: 4
    },
    {
      sku: 'CE-URBAN-C1', marca: 'central', modelo: 'Urban', variante: 'C1',
      color: 'marron', colorNombre: 'Marrón', tipo: 'receta', forma: 'redondo',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 49, puente: 22, varilla: 145 }, calceNombre: 'chico',
      precio: 133000,
      relato: 'Redondo intelectual. Quieto, sin apuro, con algo de biblioteca.',
      tags: [], stock: 11
    },
    {
      sku: 'CE-CLIX-C1', marca: 'central', modelo: 'Clix', variante: 'C1',
      color: 'havana-oscuro', colorNombre: 'Havana oscuro', tipo: 'receta', forma: 'browline',
      material: 'mixto', tinte: 'transparente', genero: 'hombre',
      calce: { lente: 53, puente: 19, varilla: 148 }, calceNombre: 'grande',
      precio: 149000,
      relato: 'Browline casual premium. Ceja de acetato, aro de metal, versátil como pocos.',
      tags: ['mas-vendido'], stock: 10, destacado: true
    },

    /* ===== CENTRAL — sol ===== */
    {
      sku: 'CE-GARY-C1', marca: 'central', modelo: 'Gary', variante: 'C1',
      color: 'negro', colorNombre: 'Negro', tipo: 'sol', forma: 'aviador',
      material: 'metal', tinte: 'gris', genero: 'hombre',
      calce: { lente: 58, puente: 14, varilla: 140 }, calceNombre: 'grande',
      precio: 169000, precioTachado: 199000,
      relato: 'Aviador clásico en negro. Lente gris, protección UV400.',
      tags: ['mas-vendido', 'uv400'], stock: 14, destacado: true
    },
    {
      sku: 'CE-GARY-C4', marca: 'central', modelo: 'Gary', variante: 'C4',
      color: 'dorado', colorNombre: 'Champagne dorado', tipo: 'sol', forma: 'aviador',
      material: 'metal', tinte: 'marron', genero: 'unisex',
      calce: { lente: 58, puente: 14, varilla: 140 }, calceNombre: 'grande',
      precio: 175000,
      relato: 'Aviador cálido en dorado champagne con lente marrón degradé.',
      tags: ['uv400'], stock: 9
    },
    {
      sku: 'CE-GARY-C5', marca: 'central', modelo: 'Gary', variante: 'C5',
      color: 'plateado', colorNombre: 'Cristal plata', tipo: 'sol', forma: 'aviador',
      material: 'titanio', tinte: 'espejado', genero: 'unisex',
      calce: { lente: 58, puente: 14, varilla: 140 }, calceNombre: 'grande',
      precio: 195000,
      relato: 'Titanio y lente espejado. El más liviano de toda la línea de sol.',
      tags: ['liviano', 'uv400', 'polarizado'], stock: 5, nuevo: true
    },
    {
      sku: 'CE-ARCANE-C5', marca: 'central', modelo: 'Arcane', variante: 'C5',
      color: 'negro', colorNombre: 'Negro', tipo: 'sol', forma: 'cateye',
      material: 'acetato', tinte: 'negro', genero: 'mujer',
      calce: { lente: 55, puente: 16, varilla: 142 }, calceNombre: 'mediano',
      precio: 189000,
      relato: 'Cat-eye dramático y escultural. El más fotografiado de la marca.',
      tags: ['mas-vendido', 'uv400'], stock: 8, destacado: true
    },
    {
      sku: 'CE-ARCANE-W', marca: 'central', modelo: 'Arcane', variante: 'White',
      color: 'blanco', colorNombre: 'Blanco hueso', tipo: 'sol', forma: 'cateye',
      material: 'acetato', tinte: 'degrade', genero: 'mujer',
      calce: { lente: 55, puente: 16, varilla: 142 }, calceNombre: 'mediano',
      precio: 195000,
      relato: 'El mismo cat-eye en blanco hueso. Contra una pared encalada, es otra cosa.',
      tags: ['edicion-limitada', 'uv400'], stock: 3, nuevo: true
    },
    {
      sku: 'CE-AURA-C5', marca: 'central', modelo: 'Aura', variante: 'C5',
      color: 'vino', colorNombre: 'Burgundy', tipo: 'sol', forma: 'mariposa',
      material: 'acetato', tinte: 'marron', genero: 'mujer',
      calce: { lente: 56, puente: 16, varilla: 142 }, calceNombre: 'grande',
      precio: 179000,
      relato: 'Mariposa en burgundy. Femenino, editorial, imposible de ignorar.',
      tags: ['uv400'], stock: 7
    },
    {
      sku: 'CE-FLEX-S', marca: 'central', modelo: 'Flex', variante: 'Silver',
      color: 'plateado', colorNombre: 'Plata', tipo: 'sol', forma: 'octagonal',
      material: 'metal', tinte: 'gris', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 165000,
      relato: 'Octogonal frío y arquitectónico. La sombra que tira es media obra de arte.',
      tags: ['uv400'], stock: 8
    },
    {
      sku: 'CE-FLEX-RG', marca: 'central', modelo: 'Flex', variante: 'Rose Gold',
      color: 'oro-rosa', colorNombre: 'Oro rosa', tipo: 'sol', forma: 'octagonal',
      material: 'metal', tinte: 'azul', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 169000,
      relato: 'Octogonal en oro rosa con lente azul degradé. El más llamativo del catálogo.',
      tags: ['uv400'], stock: 6
    },
    {
      sku: 'CE-CHILL-RG', marca: 'central', modelo: 'Chill', variante: 'Rose Gold',
      color: 'oro-rosa', colorNombre: 'Oro rosa', tipo: 'sol', forma: 'redondo',
      material: 'metal', tinte: 'rosa', genero: 'mujer',
      calce: { lente: 51, puente: 20, varilla: 145 }, calceNombre: 'chico',
      precio: 159000,
      relato: 'Retro-elegante. Redondo, oro cálido, lente rosado.',
      tags: ['uv400'], stock: 10
    },
    {
      sku: 'CE-CHILL-GM', marca: 'central', modelo: 'Chill', variante: 'Gunmetal',
      color: 'gunmetal', colorNombre: 'Gunmetal', tipo: 'sol', forma: 'redondo',
      material: 'metal', tinte: 'negro', genero: 'unisex',
      calce: { lente: 51, puente: 20, varilla: 145 }, calceNombre: 'mediano',
      precio: 155000,
      relato: 'Redondo arquitectónico y frío. Contraste total.',
      tags: ['uv400'], stock: 9
    },
    {
      sku: 'CE-FLASH-C5', marca: 'central', modelo: 'Flash', variante: 'C5',
      color: 'azul-petroleo', colorNombre: 'Azul petróleo', tipo: 'sol', forma: 'rectangular',
      material: 'tr90', tinte: 'espejado', genero: 'unisex',
      calce: { lente: 57, puente: 16, varilla: 142 }, calceNombre: 'grande',
      precio: 149000,
      relato: 'Urbano industrial. TR90 flexible, lente espejado, no se rompe ni queriendo.',
      tags: ['deportivo', 'uv400', 'polarizado'], stock: 12
    },
    {
      sku: 'CE-TRACE-S1', marca: 'central', modelo: 'Trace', variante: 'Sun',
      color: 'havana', colorNombre: 'Havana', tipo: 'sol', forma: 'panto',
      material: 'acetato', tinte: 'verde', genero: 'unisex',
      calce: { lente: 52, puente: 20, varilla: 145 }, calceNombre: 'mediano',
      precio: 159000, precioTachado: 189000,
      relato: 'La versión de sol del Trace. Misma línea limpia, lente verde G15.',
      tags: ['uv400', 'polarizado'], stock: 11, destacado: true
    },

    /* ===== DUNA — placeholder ===== */
    {
      sku: 'DU-OSTIA-01', marca: 'duna', modelo: 'Ostia', variante: 'Arena',
      color: 'champagne', colorNombre: 'Arena', tipo: 'receta', forma: 'redondo',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 49, puente: 21, varilla: 145 }, calceNombre: 'chico',
      precio: 165000, placeholder: true,
      relato: 'Redondo en acetato arena. Cálido y liviano.',
      tags: [], stock: 7
    },
    {
      sku: 'DU-OSTIA-02', marca: 'duna', modelo: 'Ostia', variante: 'Terracota',
      color: 'terracota', colorNombre: 'Terracota', tipo: 'receta', forma: 'redondo',
      material: 'acetato', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 49, puente: 21, varilla: 145 }, calceNombre: 'chico',
      precio: 165000, placeholder: true,
      relato: 'El color de la marca, sin vueltas.',
      tags: ['nuevo'], stock: 5, nuevo: true
    },
    {
      sku: 'DU-SIENA-01', marca: 'duna', modelo: 'Siena', variante: 'Havana',
      color: 'havana', colorNombre: 'Havana', tipo: 'sol', forma: 'mariposa',
      material: 'acetato', tinte: 'marron', genero: 'mujer',
      calce: { lente: 56, puente: 16, varilla: 142 }, calceNombre: 'grande',
      precio: 189000, placeholder: true,
      relato: 'Mariposa amplia en tortoise clásico.',
      tags: ['uv400'], stock: 6
    },
    {
      sku: 'DU-LIDO-01', marca: 'duna', modelo: 'Lido', variante: 'Oliva',
      color: 'oliva', colorNombre: 'Oliva', tipo: 'sol', forma: 'cuadrado',
      material: 'acetato', tinte: 'verde', genero: 'unisex',
      calce: { lente: 54, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 175000, placeholder: true,
      relato: 'Cuadrado en verde oliva con lente G15.',
      tags: ['uv400'], stock: 8
    },

    /* ===== SERÓ — placeholder ===== */
    {
      sku: 'SE-LINEA-01', marca: 'sero', modelo: 'Línea', variante: 'Titanio',
      color: 'plateado', colorNombre: 'Titanio natural', tipo: 'receta', forma: 'rectangular',
      material: 'titanio', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 53, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 259000, placeholder: true,
      relato: 'Titanio puro, 9 gramos. Te olvidás de que lo tenés puesto.',
      tags: ['liviano', 'premium'], stock: 5, destacado: true
    },
    {
      sku: 'SE-LINEA-02', marca: 'sero', modelo: 'Línea', variante: 'Gunmetal',
      color: 'gunmetal', colorNombre: 'Gunmetal', tipo: 'receta', forma: 'rectangular',
      material: 'titanio', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 53, puente: 18, varilla: 145 }, calceNombre: 'mediano',
      precio: 259000, placeholder: true,
      relato: 'El mismo titanio en gunmetal mate.',
      tags: ['liviano', 'premium'], stock: 4
    },
    {
      sku: 'SE-PUNTO-01', marca: 'sero', modelo: 'Punto', variante: 'Oro',
      color: 'dorado', colorNombre: 'Oro', tipo: 'receta', forma: 'redondo',
      material: 'titanio', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 48, puente: 22, varilla: 145 }, calceNombre: 'chico',
      precio: 275000, placeholder: true,
      relato: 'Redondo finísimo en titanio dorado.',
      tags: ['liviano', 'premium'], stock: 3
    },

    /* ===== KAIO — placeholder ===== */
    {
      sku: 'KA-RUSH-01', marca: 'kaio', modelo: 'Rush', variante: 'Negro',
      color: 'negro-mate', colorNombre: 'Negro mate', tipo: 'sol', forma: 'rectangular',
      material: 'tr90', tinte: 'espejado', genero: 'hombre',
      calce: { lente: 58, puente: 15, varilla: 140 }, calceNombre: 'grande',
      precio: 115000, placeholder: true,
      relato: 'Deportivo, flexible, con lente espejado polarizado.',
      tags: ['deportivo', 'uv400', 'polarizado'], stock: 16
    },
    {
      sku: 'KA-RUSH-02', marca: 'kaio', modelo: 'Rush', variante: 'Petróleo',
      color: 'azul-petroleo', colorNombre: 'Azul petróleo', tipo: 'sol', forma: 'rectangular',
      material: 'tr90', tinte: 'espejado-oro', genero: 'hombre',
      calce: { lente: 58, puente: 15, varilla: 140 }, calceNombre: 'grande',
      precio: 115000, placeholder: true,
      relato: 'Mismo Rush, espejado dorado.',
      tags: ['deportivo', 'uv400', 'polarizado'], stock: 13
    },
    {
      sku: 'KA-BASE-01', marca: 'kaio', modelo: 'Base', variante: 'Negro',
      color: 'negro', colorNombre: 'Negro', tipo: 'receta', forma: 'cuadrado',
      material: 'tr90', tinte: 'transparente', genero: 'unisex',
      calce: { lente: 54, puente: 17, varilla: 145 }, calceNombre: 'mediano',
      precio: 105000, placeholder: true,
      relato: 'El armazón de todos los días. Flexible y a prueba de mochila.',
      tags: ['liviano'], stock: 20
    },

    /* ===== MARÉ — placeholder ===== */
    {
      sku: 'MA-COSTA-01', marca: 'mare', modelo: 'Costa', variante: 'Nude',
      color: 'nude', colorNombre: 'Nude', tipo: 'receta', forma: 'cateye',
      material: 'acetato', tinte: 'transparente', genero: 'mujer',
      calce: { lente: 52, puente: 17, varilla: 142 }, calceNombre: 'mediano',
      precio: 185000, placeholder: true,
      relato: 'Cat-eye suave en nude. Editorial de todos los días.',
      tags: [], stock: 8, destacado: true
    },
    {
      sku: 'MA-COSTA-02', marca: 'mare', modelo: 'Costa', variante: 'Blush',
      color: 'cristal-rosa', colorNombre: 'Blush', tipo: 'receta', forma: 'cateye',
      material: 'acetato', tinte: 'transparente', genero: 'mujer',
      calce: { lente: 52, puente: 17, varilla: 142 }, calceNombre: 'mediano',
      precio: 185000, placeholder: true,
      relato: 'Translúcido rosado, casi de vidrio.',
      tags: ['nuevo'], stock: 6, nuevo: true
    },
    {
      sku: 'MA-SIRENA-01', marca: 'mare', modelo: 'Sirena', variante: 'Negro',
      color: 'negro', colorNombre: 'Negro', tipo: 'sol', forma: 'mariposa',
      material: 'acetato', tinte: 'degrade', genero: 'mujer',
      calce: { lente: 57, puente: 15, varilla: 142 }, calceNombre: 'grande',
      precio: 199000, placeholder: true,
      relato: 'Mariposa oversize con lente degradé. Para la playa y para la ciudad.',
      tags: ['uv400'], stock: 7
    }
  ];

  /* ---------- Etiquetas legibles ---------- */
  var ETIQUETAS = {
    'mas-vendido': 'Más vendido',
    'nuevo': 'Nuevo',
    'edicion-limitada': 'Edición limitada',
    'liviano': 'Ultra liviano',
    'premium': 'Premium',
    'deportivo': 'Deportivo',
    'uv400': 'UV400',
    'polarizado': 'Polarizado'
  };

  var FORMAS_NOMBRE = {
    redondo: 'Redondo', ovalado: 'Ovalado', panto: 'Panto', cuadrado: 'Cuadrado',
    rectangular: 'Rectangular', octagonal: 'Octagonal', hexagonal: 'Hexagonal',
    cateye: 'Cat eye', mariposa: 'Mariposa', aviador: 'Aviador', browline: 'Browline'
  };

  var MATERIALES_NOMBRE = {
    acetato: 'Acetato', inyectado: 'Inyectado', tr90: 'TR90', mixto: 'Mixto',
    metal: 'Metal', titanio: 'Titanio', acero: 'Acero'
  };

  /* ---------- Índices y helpers ---------- */
  var porSkuMapa = {};
  var marcaMapa = {};
  P.forEach(function (p) { porSkuMapa[p.sku] = p; });
  MARCAS.forEach(function (m) { marcaMapa[m.id] = m; });

  function nombreCompleto(p) {
    var m = marcaMapa[p.marca];
    return (m ? m.nombre : p.marca) + ' ' + p.modelo + (p.variante ? ' ' + p.variante : '');
  }

  function porSku(sku) { return porSkuMapa[sku] || null; }
  function marca(id) { return marcaMapa[id] || null; }
  function todos() { return P.slice(); }

  /* filtrar({tipo, marca:[], forma:[], material:[], color:[], genero:[],
               calce:[], tags:[], precioMax, precioMin, q})              */
  function filtrar(f) {
    f = f || {};
    var lista = P;

    function enLista(campo, valor) {
      return !f[campo] || !f[campo].length || f[campo].indexOf(valor) !== -1;
    }

    if (f.tipo && f.tipo !== 'todos') {
      lista = lista.filter(function (p) { return p.tipo === f.tipo; });
    }

    lista = lista.filter(function (p) {
      if (!enLista('marca', p.marca)) return false;
      if (!enLista('forma', p.forma)) return false;
      if (!enLista('material', p.material)) return false;
      if (!enLista('genero', p.genero) && !(f.genero && f.genero.indexOf('unisex') !== -1 && p.genero === 'unisex')) return false;
      if (!enLista('calce', p.calceNombre)) return false;
      if (f.tags && f.tags.length) {
        var tiene = f.tags.some(function (t) { return (p.tags || []).indexOf(t) !== -1; });
        if (!tiene) return false;
      }
      if (f.precioMin != null && p.precio < f.precioMin) return false;
      if (f.precioMax != null && p.precio > f.precioMax) return false;
      if (f.soloStock && !p.stock) return false;
      if (f.q) {
        var texto = (nombreCompleto(p) + ' ' + p.colorNombre + ' ' + FORMAS_NOMBRE[p.forma] + ' ' + (p.relato || '')).toLowerCase();
        if (texto.indexOf(String(f.q).toLowerCase()) === -1) return false;
      }
      return true;
    });

    return lista;
  }

  var ORDENES = {
    relevancia: function (a, b) {
      var pa = (a.destacado ? 2 : 0) + ((a.tags || []).indexOf('mas-vendido') !== -1 ? 1 : 0);
      var pb = (b.destacado ? 2 : 0) + ((b.tags || []).indexOf('mas-vendido') !== -1 ? 1 : 0);
      return pb - pa;
    },
    'precio-asc': function (a, b) { return a.precio - b.precio; },
    'precio-desc': function (a, b) { return b.precio - a.precio; },
    nuevos: function (a, b) { return (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0); },
    nombre: function (a, b) { return nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'); }
  };

  function ordenar(lista, criterio) {
    var fn = ORDENES[criterio] || ORDENES.relevancia;
    return lista.slice().sort(fn);
  }

  /* Cuenta cuántos resultados daría cada opción, para poder mostrar los
     contadores del panel de filtros y deshabilitar las que dan cero.     */
  function facetas(base) {
    var campos = ['marca', 'forma', 'material', 'genero', 'calceNombre'];
    var out = {};
    campos.forEach(function (c) { out[c] = {}; });
    out.tags = {};
    base.forEach(function (p) {
      campos.forEach(function (c) {
        var v = p[c];
        if (v == null) return;
        out[c][v] = (out[c][v] || 0) + 1;
      });
      (p.tags || []).forEach(function (t) { out.tags[t] = (out.tags[t] || 0) + 1; });
    });
    return out;
  }

  function relacionados(p, n) {
    n = n || 4;
    if (!p) return [];
    var puntaje = P.filter(function (o) { return o.sku !== p.sku; }).map(function (o) {
      var s = 0;
      if (o.tipo === p.tipo) s += 3;
      if (o.forma === p.forma) s += 3;
      if (o.marca === p.marca) s += 2;
      if (o.material === p.material) s += 1;
      if (o.genero === p.genero) s += 1;
      s -= Math.abs(o.precio - p.precio) / 100000;
      return { p: o, s: s };
    });
    puntaje.sort(function (a, b) { return b.s - a.s; });
    return puntaje.slice(0, n).map(function (x) { return x.p; });
  }

  function destacados(n) {
    return P.filter(function (p) { return p.destacado; }).slice(0, n || 8);
  }

  function novedades(n) {
    return P.filter(function (p) { return p.nuevo; }).slice(0, n || 8);
  }

  function rangoPrecios() {
    var min = Infinity, max = 0;
    P.forEach(function (p) { min = Math.min(min, p.precio); max = Math.max(max, p.precio); });
    return { min: min, max: max };
  }

  global.Catalogo = {
    MARCAS: MARCAS,
    ETIQUETAS: ETIQUETAS,
    FORMAS_NOMBRE: FORMAS_NOMBRE,
    MATERIALES_NOMBRE: MATERIALES_NOMBRE,
    todos: todos,
    porSku: porSku,
    marca: marca,
    nombreCompleto: nombreCompleto,
    filtrar: filtrar,
    ordenar: ordenar,
    facetas: facetas,
    relacionados: relacionados,
    destacados: destacados,
    novedades: novedades,
    rangoPrecios: rangoPrecios
  };

  // También se carga desde Node (ver api/_precios.js).
  if (typeof module !== 'undefined' && module.exports) module.exports = global.Catalogo;
})(typeof window !== 'undefined' ? window : globalThis);
