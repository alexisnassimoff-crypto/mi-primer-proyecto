const brands = [
  { id: 1, name: 'Ray-Ban', slug: 'ray-ban', logo: 'RB', description: 'Iconica marca de anteojos de sol y opticos conocida mundialmente.' },
  { id: 2, name: 'Oakley', slug: 'oakley', logo: 'OA', description: 'Lider en anteojos deportivos y de alto rendimiento.' },
  { id: 3, name: 'Gucci', slug: 'gucci', logo: 'GG', description: 'Lujo italiano en cada diseno de eyewear.' },
  { id: 4, name: 'Prada', slug: 'prada', logo: 'PR', description: 'Elegancia y sofisticacion en anteojos premium.' },
  { id: 5, name: 'Tom Ford', slug: 'tom-ford', logo: 'TF', description: 'Disenos exclusivos con estilo contemporaneo.' },
  { id: 6, name: 'Versace', slug: 'versace', logo: 'VS', description: 'Boldness y glamour en cada pieza.' },
  { id: 7, name: 'Dior', slug: 'dior', logo: 'CD', description: 'Alta moda francesa en eyewear de lujo.' },
  { id: 8, name: 'Carrera', slug: 'carrera', logo: 'CA', description: 'Estilo deportivo con diseno vanguardista.' },
  { id: 9, name: 'Persol', slug: 'persol', logo: 'PO', description: 'Artesania italiana desde 1917.' },
  { id: 10, name: 'Burberry', slug: 'burberry', logo: 'BB', description: 'Elegancia britanica clasica en eyewear.' },
];

const categories = [
  { id: 1, name: 'Anteojos de Sol', slug: 'anteojos-de-sol', icon: 'sun', description: 'Proteccion UV con estilo' },
  { id: 2, name: 'Armazones Opticos', slug: 'armazones-opticos', icon: 'glasses', description: 'Armazones para lentes recetados' },
  { id: 3, name: 'Anteojos Deportivos', slug: 'anteojos-deportivos', icon: 'sport', description: 'Rendimiento y proteccion' },
  { id: 4, name: 'Anteojos de Lectura', slug: 'anteojos-de-lectura', icon: 'reading', description: 'Comodidad para la lectura' },
  { id: 5, name: 'Lentes de Contacto', slug: 'lentes-de-contacto', icon: 'contact', description: 'Lentes de contacto al por mayor' },
  { id: 6, name: 'Accesorios', slug: 'accesorios', icon: 'accessory', description: 'Estuches, panos y mas' },
];

// Product image sets - different angles/styles for sunglasses
const productImages = [
  [
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1577803645773-f96470509666?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=200&h=200&fit=crop',
  ],
];

// Optical frames images
const opticalImages = [
  [
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=200&h=200&fit=crop',
  ],
];

const generateProducts = () => {
  const shapes = ['Aviador', 'Wayfarer', 'Cat Eye', 'Redondo', 'Rectangular', 'Cuadrado', 'Piloto', 'Oversized', 'Wrap', 'Browline'];
  const materials = ['Acetato', 'Metal', 'Titanio', 'TR90', 'Nylon', 'Acero Inoxidable'];
  const colors = [
    { name: 'Negro', hex: '#1a1a1a' },
    { name: 'Tortuga', hex: '#8B4513' },
    { name: 'Dorado', hex: '#DAA520' },
    { name: 'Plateado', hex: '#C0C0C0' },
    { name: 'Azul', hex: '#1e40af' },
    { name: 'Rojo', hex: '#dc2626' },
    { name: 'Transparente', hex: '#e5e7eb' },
    { name: 'Havana', hex: '#6B3A2A' },
    { name: 'Rosa', hex: '#ec4899' },
    { name: 'Verde', hex: '#166534' },
  ];
  const genders = ['Hombre', 'Mujer', 'Unisex'];
  const lensColors = ['Gris', 'Marron', 'Verde G-15', 'Azul Espejado', 'Rosa Espejado', 'Degrade', 'Amarillo', 'Polarizado Gris'];

  const productTemplates = [
    { prefix: 'Classic', category: 1 },
    { prefix: 'Urban', category: 1 },
    { prefix: 'Elite', category: 2 },
    { prefix: 'Vision', category: 2 },
    { prefix: 'Sport Pro', category: 3 },
    { prefix: 'Active', category: 3 },
    { prefix: 'Reader', category: 4 },
    { prefix: 'Comfort', category: 4 },
    { prefix: 'Signature', category: 1 },
    { prefix: 'Premium', category: 2 },
  ];

  const products = [];
  let id = 1;

  brands.forEach((brand, bIdx) => {
    productTemplates.forEach((template, tIdx) => {
      const shape = shapes[tIdx % shapes.length];
      const material = materials[tIdx % materials.length];
      const gender = genders[tIdx % genders.length];
      const colorVariants = colors.slice(0, 3 + (tIdx % 4));
      const basePrice = 25 + Math.floor(Math.random() * 120);
      const retailPrice = basePrice * 2.5 + Math.floor(Math.random() * 50);

      // Pick images based on category
      const imgSet = template.category <= 1 || template.category === 3
        ? productImages[(bIdx * 3 + tIdx) % productImages.length]
        : opticalImages[(bIdx + tIdx) % opticalImages.length];

      products.push({
        id: id++,
        sku: `${brand.slug.toUpperCase().replace('-', '')}-${template.prefix.replace(' ', '').toUpperCase()}-${String(id).padStart(4, '0')}`,
        name: `${brand.name} ${template.prefix} ${shape}`,
        brand: brand,
        brandId: brand.id,
        category: categories.find(c => c.id === template.category),
        categoryId: template.category,
        shape,
        material,
        gender,
        colors: colorVariants,
        lensColor: template.category === 1 || template.category === 3 ? lensColors[tIdx % lensColors.length] : null,
        wholesalePrice: basePrice,
        retailPrice: retailPrice,
        minOrder: 6,
        bulkPricing: [
          { qty: 6, price: basePrice },
          { qty: 12, price: Math.round(basePrice * 0.92) },
          { qty: 24, price: Math.round(basePrice * 0.85) },
          { qty: 48, price: Math.round(basePrice * 0.78) },
          { qty: 96, price: Math.round(basePrice * 0.72) },
        ],
        stock: Math.floor(Math.random() * 500) + 20,
        images: imgSet,
        featured: tIdx < 3,
        newArrival: tIdx > 7,
        bestSeller: tIdx >= 3 && tIdx <= 5,
        description: `${brand.name} ${template.prefix} ${shape} - Fabricado en ${material} de alta calidad. Diseno ${shape.toLowerCase()} ${gender.toLowerCase()}. Incluye estuche original de la marca y pano de microfibra.`,
        specs: {
          lensWidth: 48 + Math.floor(Math.random() * 12),
          bridgeWidth: 16 + Math.floor(Math.random() * 6),
          templeLength: 135 + Math.floor(Math.random() * 15),
          lensHeight: 38 + Math.floor(Math.random() * 15),
        },
        uv: template.category === 1 || template.category === 3 ? 'UV400' : null,
        polarized: Math.random() > 0.6,
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        reviews: Math.floor(Math.random() * 200),
      });
    });
  });

  return products;
};

const products = generateProducts();

export { brands, categories, products };
