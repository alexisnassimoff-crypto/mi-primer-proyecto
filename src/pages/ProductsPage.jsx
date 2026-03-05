import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Grid3X3, List } from 'lucide-react';
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
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-gray-400 mt-2 tracking-wide">{filteredProducts.length} productos encontrados</p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-36 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs tracking-[0.2em] font-bold uppercase">Filtros</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[11px] text-gray-400 hover:text-black transition-colors">Limpiar</button>
              )}
            </div>

            {/* Categories filter */}
            <div>
              <h4 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Categoria</h4>
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
                    className={`block w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      activeCategory === cat.slug ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand filter */}
            <div>
              <h4 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Marca</h4>
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
                    className={`block w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      activeBrand === brand.slug ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <h4 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Genero</h4>
              <div className="space-y-1">
                {['Hombre', 'Mujer', 'Unisex'].map(g => (
                  <button
                    key={g}
                    onClick={() => { setSelectedGender(selectedGender === g ? '' : g); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      selectedGender === g ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape */}
            <div>
              <h4 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Forma</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {shapes.map(shape => (
                  <button
                    key={shape}
                    onClick={() => { setSelectedShape(selectedShape === shape ? '' : shape); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      selectedShape === shape ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Material */}
            <div>
              <h4 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Material</h4>
              <div className="space-y-1">
                {materialsSet.map(mat => (
                  <button
                    key={mat}
                    onClick={() => { setSelectedMaterial(selectedMaterial === mat ? '' : mat); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      selectedMaterial === mat ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <h4 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Precio</h4>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={priceRange[1]}
                  onChange={(e) => { setPriceRange([priceRange[0], parseInt(e.target.value)]); setCurrentPage(1); }}
                  className="w-full accent-black"
                />
                <div className="flex justify-between text-[12px] text-gray-400">
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
                className="accent-black w-4 h-4"
              />
              <span className="text-[13px]">Solo Polarizados</span>
            </label>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border text-[12px] tracking-wide hover:bg-gray-50"
            >
              <SlidersHorizontal size={16} /> FILTROS
              {hasActiveFilters && <span className="w-2 h-2 bg-black rounded-full" />}
            </button>

            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border text-[12px] focus:outline-none focus:border-black"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Menor Precio</option>
                <option value="price-desc">Mayor Precio</option>
                <option value="name">Nombre A-Z</option>
                <option value="newest">Mas Nuevos</option>
                <option value="rating">Mejor Rating</option>
              </select>

              <div className="hidden sm:flex border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeCategory && (
                <span className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[11px] tracking-wide">
                  {categories.find(c => c.slug === activeCategory)?.name}
                  <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('categoria'); setSearchParams(p); }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {activeBrand && (
                <span className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[11px] tracking-wide">
                  {brands.find(b => b.slug === activeBrand)?.name}
                  <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('marca'); setSearchParams(p); }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedGender && (
                <span className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[11px] tracking-wide">
                  {selectedGender}
                  <button onClick={() => setSelectedGender('')}><X size={12} /></button>
                </span>
              )}
              {selectedShape && (
                <span className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[11px] tracking-wide">
                  {selectedShape}
                  <button onClick={() => setSelectedShape('')}><X size={12} /></button>
                </span>
              )}
              {onlyPolarized && (
                <span className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[11px] tracking-wide">
                  Polarizado
                  <button onClick={() => setOnlyPolarized(false)}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="lg:hidden bg-white border p-5 mb-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs tracking-[0.2em] font-bold uppercase">Filtros</h3>
                <button onClick={() => setShowFilters(false)}><X size={18} /></button>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold mb-1 uppercase tracking-wide">Categoria</h4>
                <select
                  value={activeCategory}
                  onChange={(e) => {
                    const p = new URLSearchParams(searchParams);
                    e.target.value ? p.set('categoria', e.target.value) : p.delete('categoria');
                    setSearchParams(p);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border text-sm"
                >
                  <option value="">Todas</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold mb-1 uppercase tracking-wide">Marca</h4>
                <select
                  value={activeBrand}
                  onChange={(e) => {
                    const p = new URLSearchParams(searchParams);
                    e.target.value ? p.set('marca', e.target.value) : p.delete('marca');
                    setSearchParams(p);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border text-sm"
                >
                  <option value="">Todas</option>
                  {brands.map(b => <option key={b.id} value={b.slug}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold mb-1 uppercase tracking-wide">Genero</h4>
                <select value={selectedGender} onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border text-sm">
                  <option value="">Todos</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={onlyPolarized} onChange={(e) => setOnlyPolarized(e.target.checked)} className="accent-black" />
                <span className="text-sm">Solo Polarizados</span>
              </label>
              <div className="flex gap-2">
                <button onClick={clearFilters} className="flex-1 px-4 py-2 border text-[12px] hover:bg-gray-50">Limpiar</button>
                <button onClick={() => setShowFilters(false)} className="flex-1 px-4 py-2 bg-black text-white text-[12px]">Aplicar</button>
              </div>
            </div>
          )}

          {/* Products */}
          {paginatedProducts.length > 0 ? (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8'
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
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border text-[12px] tracking-wide hover:bg-gray-50 disabled:opacity-30"
                  >
                    ANTERIOR
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
                        className={`w-10 h-10 text-[13px] font-medium ${
                          currentPage === page ? 'bg-black text-white' : 'border hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border text-[12px] tracking-wide hover:bg-gray-50 disabled:opacity-30"
                  >
                    SIGUIENTE
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-bold text-gray-400 mb-2">No se encontraron productos</h3>
              <p className="text-sm text-gray-400 mb-6">Proba con otros filtros o terminos de busqueda</p>
              <button onClick={clearFilters} className="px-8 py-3 bg-black text-white text-[12px] tracking-[0.15em] hover:bg-gray-800">
                LIMPIAR FILTROS
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
    <a href={`/producto/${product.id}`} className="flex gap-5 p-4 border border-gray-100 hover:border-gray-300 transition-colors group">
      <div className="w-28 h-28 bg-[#f5f5f5] shrink-0 overflow-hidden">
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] tracking-[0.1em] text-gray-400 uppercase">{product.brand.name}</p>
        <p className="text-sm font-medium text-gray-900 group-hover:opacity-70 transition-opacity">{product.name}</p>
        <p className="text-[11px] text-gray-400 mt-1">SKU: {product.sku} · {product.shape} · {product.material}</p>
        <div className="flex gap-1 mt-2">
          {product.colors.slice(0, 4).map(c => (
            <span key={c.name} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      </div>
      <div className="text-right shrink-0 self-center">
        <p className="text-[11px] text-gray-400 line-through">${product.retailPrice.toLocaleString()}</p>
        <p className="text-base font-bold">${product.wholesalePrice.toLocaleString()}</p>
        <span className="text-[11px] text-gray-500">-{discount}%</span>
      </div>
    </a>
  );
}
