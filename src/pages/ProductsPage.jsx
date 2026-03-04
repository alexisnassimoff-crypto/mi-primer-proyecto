import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Grid3X3, List, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products, brands, categories } from '../data/products';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');

  const activeCategory = searchParams.get('categoria') || '';
  const activeBrand = searchParams.get('marca') || '';
  const searchQuery = searchParams.get('buscar') || '';
  const isNew = searchParams.get('nuevos') === 'true';
  const isOffer = searchParams.get('ofertas') === 'true';

  const [priceRange, setPriceRange] = useState([0, 300]);
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [onlyPolarized, setOnlyPolarized] = useState(false);

  const shapes = [...new Set(products.map(p => p.shape))];
  const materialsSet = [...new Set(products.map(p => p.material))];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory) result = result.filter(p => p.category.slug === activeCategory);
    if (activeBrand) result = result.filter(p => p.brand.slug === activeBrand);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.name.toLowerCase().includes(q) ||
        p.shape.toLowerCase().includes(q)
      );
    }
    if (isNew) result = result.filter(p => p.newArrival);
    if (isOffer) result = result.filter(p => p.bestSeller || p.featured);
    if (selectedGender) result = result.filter(p => p.gender === selectedGender);
    if (selectedShape) result = result.filter(p => p.shape === selectedShape);
    if (selectedMaterial) result = result.filter(p => p.material === selectedMaterial);
    if (onlyPolarized) result = result.filter(p => p.polarized);
    result = result.filter(p => p.wholesalePrice >= priceRange[0] && p.wholesalePrice <= priceRange[1]);

    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.wholesalePrice - b.wholesalePrice); break;
      case 'price-desc': result.sort((a, b) => b.wholesalePrice - a.wholesalePrice); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': result.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0)); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }

    return result;
  }, [activeCategory, activeBrand, searchQuery, isNew, isOffer, selectedGender, selectedShape, selectedMaterial, onlyPolarized, priceRange, sortBy]);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * perPage, currentPage * perPage);

  const clearFilters = () => {
    setSearchParams({});
    setSelectedGender('');
    setSelectedShape('');
    setSelectedMaterial('');
    setOnlyPolarized(false);
    setPriceRange([0, 300]);
    setCurrentPage(1);
  };

  const pageTitle = activeCategory
    ? categories.find(c => c.slug === activeCategory)?.name || 'Productos'
    : activeBrand
    ? brands.find(b => b.slug === activeBrand)?.name || 'Productos'
    : isNew
    ? 'Nuevos Ingresos'
    : isOffer
    ? 'Ofertas Especiales'
    : searchQuery
    ? `Resultados para "${searchQuery}"`
    : 'Todos los Productos';

  const hasActiveFilters = activeCategory || activeBrand || searchQuery || isNew || isOffer || selectedGender || selectedShape || selectedMaterial || onlyPolarized;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">{pageTitle}</h1>
        <p className="text-gray-500 mt-1">{filteredProducts.length} productos encontrados</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-36 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Filtros</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-accent hover:underline">Limpiar</button>
              )}
            </div>

            {/* Categories filter */}
            <div>
              <h4 className="font-semibold mb-2">Categoría</h4>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      if (activeCategory === cat.slug) params.delete('categoria');
                      else params.set('categoria', cat.slug);
                      setSearchParams(params);
                      setCurrentPage(1);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      activeCategory === cat.slug ? 'bg-accent text-white' : 'hover:bg-surface'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand filter */}
            <div>
              <h4 className="font-semibold mb-2">Marca</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      if (activeBrand === brand.slug) params.delete('marca');
                      else params.set('marca', brand.slug);
                      setSearchParams(params);
                      setCurrentPage(1);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      activeBrand === brand.slug ? 'bg-accent text-white' : 'hover:bg-surface'
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <h4 className="font-semibold mb-2">Género</h4>
              <div className="space-y-1">
                {['Hombre', 'Mujer', 'Unisex'].map(g => (
                  <button
                    key={g}
                    onClick={() => { setSelectedGender(selectedGender === g ? '' : g); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedGender === g ? 'bg-accent text-white' : 'hover:bg-surface'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape */}
            <div>
              <h4 className="font-semibold mb-2">Forma</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {shapes.map(shape => (
                  <button
                    key={shape}
                    onClick={() => { setSelectedShape(selectedShape === shape ? '' : shape); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedShape === shape ? 'bg-accent text-white' : 'hover:bg-surface'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Material */}
            <div>
              <h4 className="font-semibold mb-2">Material</h4>
              <div className="space-y-1">
                {materialsSet.map(mat => (
                  <button
                    key={mat}
                    onClick={() => { setSelectedMaterial(selectedMaterial === mat ? '' : mat); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedMaterial === mat ? 'bg-accent text-white' : 'hover:bg-surface'
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <h4 className="font-semibold mb-2">Precio Mayorista</h4>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={priceRange[1]}
                  onChange={(e) => { setPriceRange([priceRange[0], parseInt(e.target.value)]); setCurrentPage(1); }}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Polarized */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPolarized}
                onChange={(e) => { setOnlyPolarized(e.target.checked); setCurrentPage(1); }}
                className="accent-accent w-4 h-4"
              />
              <span className="text-sm font-medium">Solo Polarizados</span>
            </label>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-surface"
            >
              <SlidersHorizontal size={18} /> Filtros
              {hasActiveFilters && <span className="w-2 h-2 bg-accent rounded-full" />}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Menor Precio</option>
                  <option value="price-desc">Mayor Precio</option>
                  <option value="name">Nombre A-Z</option>
                  <option value="newest">Más Nuevos</option>
                  <option value="rating">Mejor Rating</option>
                </select>
              </div>

              <div className="hidden sm:flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-accent text-white' : 'hover:bg-surface'}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-accent text-white' : 'hover:bg-surface'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeCategory && (
                <span className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {categories.find(c => c.slug === activeCategory)?.name}
                  <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('categoria'); setSearchParams(p); }}>
                    <X size={14} />
                  </button>
                </span>
              )}
              {activeBrand && (
                <span className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {brands.find(b => b.slug === activeBrand)?.name}
                  <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('marca'); setSearchParams(p); }}>
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedGender && (
                <span className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {selectedGender}
                  <button onClick={() => setSelectedGender('')}><X size={14} /></button>
                </span>
              )}
              {selectedShape && (
                <span className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {selectedShape}
                  <button onClick={() => setSelectedShape('')}><X size={14} /></button>
                </span>
              )}
              {onlyPolarized && (
                <span className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  Polarizado
                  <button onClick={() => setOnlyPolarized(false)}><X size={14} /></button>
                </span>
              )}
            </div>
          )}

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="lg:hidden bg-white border rounded-lg p-4 mb-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Filtros</h3>
                <button onClick={() => setShowFilters(false)}><X size={20} /></button>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">Categoría</h4>
                <select
                  value={activeCategory}
                  onChange={(e) => {
                    const p = new URLSearchParams(searchParams);
                    e.target.value ? p.set('categoria', e.target.value) : p.delete('categoria');
                    setSearchParams(p);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">Todas</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">Marca</h4>
                <select
                  value={activeBrand}
                  onChange={(e) => {
                    const p = new URLSearchParams(searchParams);
                    e.target.value ? p.set('marca', e.target.value) : p.delete('marca');
                    setSearchParams(p);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">Todas</option>
                  {brands.map(b => <option key={b.id} value={b.slug}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">Género</h4>
                <select value={selectedGender} onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border rounded text-sm">
                  <option value="">Todos</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={onlyPolarized} onChange={(e) => setOnlyPolarized(e.target.checked)} className="accent-accent" />
                <span className="text-sm">Solo Polarizados</span>
              </label>
              <div className="flex gap-2">
                <button onClick={clearFilters} className="flex-1 px-4 py-2 border rounded text-sm hover:bg-surface">Limpiar</button>
                <button onClick={() => setShowFilters(false)} className="flex-1 px-4 py-2 bg-accent text-white rounded text-sm">Aplicar</button>
              </div>
            </div>
          )}

          {/* Products */}
          {paginatedProducts.length > 0 ? (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {paginatedProducts.map(product => (
                  viewMode === 'grid' ? (
                    <ProductCard key={product.id} product={product} />
                  ) : (
                    <ProductListItem key={product.id} product={product} />
                  )
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded hover:bg-surface disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded font-medium ${
                          currentPage === page ? 'bg-accent text-white' : 'border hover:bg-surface'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded hover:bg-surface disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔍</p>
              <h3 className="text-xl font-bold text-gray-600 mb-2">No se encontraron productos</h3>
              <p className="text-gray-400 mb-4">Probá con otros filtros o términos de búsqueda</p>
              <button onClick={clearFilters} className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover">
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductListItem({ product }) {
  const discount = Math.round((1 - product.wholesalePrice / product.retailPrice) * 100);
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex gap-4 hover:shadow-md transition-shadow">
      <div className="w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-4xl shrink-0">
        {product.categoryId === 1 ? '🕶️' : product.categoryId === 3 ? '🥽' : '👓'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-accent font-semibold">{product.brand.name}</p>
        <a href={`/producto/${product.id}`} className="font-semibold text-gray-800 hover:text-accent line-clamp-1">{product.name}</a>
        <p className="text-xs text-gray-500">SKU: {product.sku} · {product.shape} · {product.material} · {product.gender}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-1">
            {product.colors.slice(0, 4).map(c => (
              <span key={c.name} className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
          {product.polarized && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Polarizado</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-400 line-through">${product.retailPrice.toLocaleString()}</p>
        <p className="text-lg font-bold text-primary">${product.wholesalePrice.toLocaleString()}</p>
        <span className="text-xs text-green-600 font-semibold">-{discount}% OFF</span>
      </div>
    </div>
  );
}
