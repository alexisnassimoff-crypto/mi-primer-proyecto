import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, ChevronRight, Minus, Plus, Check } from 'lucide-react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find(p => p.id === parseInt(id));
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(product?.minOrder || 6);
  const [activeTab, setActiveTab] = useState('description');
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <Link to="/productos" className="text-accent hover:underline">Volver al catálogo</Link>
      </div>
    );
  }

  const currentPrice = [...product.bulkPricing].reverse().find(t => quantity >= t.qty)?.price || product.wholesalePrice;
  const totalPrice = currentPrice * quantity;
  const relatedProducts = products.filter(p => p.brandId === product.brandId && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity, product.colors[selectedColor].name);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-accent">Inicio</Link>
        <ChevronRight size={14} />
        <Link to="/productos" className="hover:text-accent">Productos</Link>
        <ChevronRight size={14} />
        <Link to={`/productos?categoria=${product.category.slug}`} className="hover:text-accent">{product.category.name}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-[120px] md:text-[180px]">
              {product.categoryId === 1 ? '🕶️' : product.categoryId === 3 ? '🥽' : '👓'}
            </span>
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.newArrival && <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">NUEVO</span>}
              {product.bestSeller && <span className="bg-accent text-white text-xs px-3 py-1 rounded-full font-semibold">TOP VENTA</span>}
              {product.polarized && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">POLARIZADO</span>}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-accent transition-colors">
                <span className="text-3xl">{product.categoryId === 1 ? '🕶️' : '👓'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-accent font-semibold uppercase tracking-wide text-sm">{product.brand.name}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mt-1">{product.name}</h1>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'text-gray-300'} />
              ))}
              <span className="text-sm font-medium ml-1">{product.rating}</span>
              <span className="text-sm text-gray-400">({product.reviews} reseñas)</span>
            </div>
            <span className="text-sm text-gray-400">SKU: {product.sku}</span>
          </div>

          {/* Price */}
          <div className="mt-6 p-4 bg-surface rounded-xl">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-primary">${currentPrice.toLocaleString()}</span>
              <span className="text-lg text-gray-400 line-through">${product.retailPrice.toLocaleString()}</span>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                {Math.round((1 - currentPrice / product.retailPrice) * 100)}% OFF
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Precio por unidad · IVA no incluido</p>
          </div>

          {/* Bulk pricing table */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Precios por Volumen</h3>
            <div className="grid grid-cols-5 gap-2">
              {product.bulkPricing.map(tier => (
                <button
                  key={tier.qty}
                  onClick={() => setQuantity(tier.qty)}
                  className={`p-2 rounded-lg border text-center text-sm transition-colors ${
                    quantity >= tier.qty && (product.bulkPricing.find(t => t.qty > tier.qty)?.qty > quantity || !product.bulkPricing.find(t => t.qty > tier.qty))
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-200 hover:border-accent'
                  }`}
                >
                  <p className="font-bold">{tier.qty}+</p>
                  <p className="text-xs">${tier.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Color: <span className="text-accent">{product.colors[selectedColor].name}</span></h3>
            <div className="flex gap-2">
              {product.colors.map((color, i) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(i)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === i ? 'border-accent scale-110 shadow-md' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Cantidad <span className="text-sm text-gray-400 font-normal">(mín. {product.minOrder} unidades)</span></h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(product.minOrder, q - product.minOrder))}
                  className="px-3 py-2 hover:bg-surface transition-colors"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                  className="w-20 text-center py-2 font-medium focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(q => q + product.minOrder)}
                  className="px-3 py-2 hover:bg-surface transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Total: <span className="font-bold text-primary text-lg">${totalPrice.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Stock */}
          <p className="mt-4 text-sm">
            {product.stock > 50 ? (
              <span className="text-green-600 font-medium">✓ En stock ({product.stock} disponibles)</span>
            ) : product.stock > 0 ? (
              <span className="text-orange-500 font-medium">⚠ Últimas unidades ({product.stock} disponibles)</span>
            ) : (
              <span className="text-red-500 font-medium">✗ Sin stock</span>
            )}
          </p>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-accent text-white hover:bg-accent-hover'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {added ? <><Check size={22} /> Agregado!</> : <><ShoppingCart size={22} /> Agregar al Carrito</>}
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:text-accent transition-colors">
              <Heart size={22} />
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:text-accent transition-colors">
              <Share2 size={22} />
            </button>
          </div>

          {!isAuthenticated && (
            <p className="mt-3 text-sm text-gray-500 bg-surface p-3 rounded-lg">
              💡 <Link to="/login" className="text-accent font-medium hover:underline">Iniciá sesión</Link> o{' '}
              <Link to="/registro" className="text-accent font-medium hover:underline">registrate</Link> para ver precios exclusivos.
            </p>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <Truck size={24} className="mx-auto text-accent mb-1" />
              <p className="text-xs font-medium">Envío Gratis</p>
              <p className="text-xs text-gray-400">+$500.000</p>
            </div>
            <div className="text-center">
              <Shield size={24} className="mx-auto text-accent mb-1" />
              <p className="text-xs font-medium">100% Original</p>
              <p className="text-xs text-gray-400">Garantizado</p>
            </div>
            <div className="text-center">
              <RotateCcw size={24} className="mx-auto text-accent mb-1" />
              <p className="text-xs font-medium">Devoluciones</p>
              <p className="text-xs text-gray-400">30 días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex border-b">
          {[
            { key: 'description', label: 'Descripción' },
            { key: 'specs', label: 'Especificaciones' },
            { key: 'shipping', label: 'Envío' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.key ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-gray-600">{product.description}</p>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>• Material: {product.material}</li>
                <li>• Forma: {product.shape}</li>
                <li>• Género: {product.gender}</li>
                {product.uv && <li>• Protección: {product.uv}</li>}
                {product.polarized && <li>• Lentes polarizados</li>}
                {product.lensColor && <li>• Color de lente: {product.lensColor}</li>}
                <li>• Incluye estuche y paño de microfibra original</li>
              </ul>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Ancho de lente</span>
                <span className="font-medium">{product.specs.lensWidth}mm</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Ancho de puente</span>
                <span className="font-medium">{product.specs.bridgeWidth}mm</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Largo de patilla</span>
                <span className="font-medium">{product.specs.templeLength}mm</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Alto de lente</span>
                <span className="font-medium">{product.specs.lensHeight}mm</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Material</span>
                <span className="font-medium">{product.material}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Forma</span>
                <span className="font-medium">{product.shape}</span>
              </div>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-gray-600">
              <div className="bg-surface p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Envío a todo el país</h4>
                <ul className="space-y-1 text-sm">
                  <li>• CABA y GBA: 24-48 horas hábiles</li>
                  <li>• Interior: 3-5 días hábiles</li>
                  <li>• Envío gratis en pedidos superiores a $500.000</li>
                </ul>
              </div>
              <div className="bg-surface p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Métodos de envío</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Correo Argentino</li>
                  <li>• OCA</li>
                  <li>• Andreani</li>
                  <li>• Retiro en showroom (CABA)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold text-primary mb-6">Productos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
