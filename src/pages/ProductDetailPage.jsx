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
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <Link to="/productos" className="text-sm tracking-[0.15em] underline underline-offset-4 hover:opacity-60">
          VOLVER AL CATALOGO
        </Link>
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
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-gray-400 mb-8">
        <Link to="/" className="hover:text-black transition-colors">Inicio</Link>
        <ChevronRight size={12} />
        <Link to="/productos" className="hover:text-black transition-colors">Productos</Link>
        <ChevronRight size={12} />
        <Link to={`/productos?categoria=${product.category.slug}`} className="hover:text-black transition-colors">{product.category.name}</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.newArrival && <span className="bg-black text-white text-[10px] tracking-[0.15em] px-3 py-1 font-medium">NEW</span>}
              {product.bestSeller && <span className="bg-black text-white text-[10px] tracking-[0.15em] px-3 py-1 font-medium">TOP</span>}
              {product.polarized && <span className="bg-black text-white text-[10px] tracking-[0.15em] px-3 py-1 font-medium">POLARIZADO</span>}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 bg-[#f5f5f5] overflow-hidden border-2 transition-colors ${
                  selectedImage === i ? 'border-black' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase">{product.brand.name}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{product.name}</h1>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-black text-black' : 'text-gray-200'} />
              ))}
              <span className="text-[12px] font-medium ml-1">{product.rating}</span>
              <span className="text-[12px] text-gray-400">({product.reviews})</span>
            </div>
            <span className="text-[11px] text-gray-400 tracking-wide">SKU: {product.sku}</span>
          </div>

          {/* Price */}
          <div className="mt-6 p-5 bg-[#f8f8f8]">
            <div className="flex items-end gap-3">
              <span className="text-2xl font-bold">${currentPrice.toLocaleString()}</span>
              <span className="text-base text-gray-400 line-through">${product.retailPrice.toLocaleString()}</span>
              <span className="text-[11px] bg-black text-white px-2 py-0.5 font-medium">
                -{Math.round((1 - currentPrice / product.retailPrice) * 100)}%
              </span>
            </div>
            <p className="text-[12px] text-gray-400 mt-1">Precio por unidad · IVA no incluido</p>
          </div>

          {/* Bulk pricing table */}
          <div className="mt-5">
            <h3 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">Precios por Volumen</h3>
            <div className="grid grid-cols-5 gap-2">
              {product.bulkPricing.map(tier => (
                <button
                  key={tier.qty}
                  onClick={() => setQuantity(tier.qty)}
                  className={`p-2 border text-center text-[12px] transition-colors ${
                    quantity >= tier.qty && (product.bulkPricing.find(t => t.qty > tier.qty)?.qty > quantity || !product.bulkPricing.find(t => t.qty > tier.qty))
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-black'
                  }`}
                >
                  <p className="font-bold">{tier.qty}+</p>
                  <p className="text-[11px] opacity-70">${tier.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-6">
            <h3 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">
              Color: <span className="font-normal text-gray-500">{product.colors[selectedColor].name}</span>
            </h3>
            <div className="flex gap-2">
              {product.colors.map((color, i) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(i)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    selectedColor === i ? 'border-black scale-110' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <h3 className="text-[11px] tracking-[0.15em] font-semibold uppercase mb-3">
              Cantidad <span className="font-normal text-gray-400">(min. {product.minOrder} un.)</span>
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center border">
                <button
                  onClick={() => setQuantity(q => Math.max(product.minOrder, q - product.minOrder))}
                  className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                  className="w-16 text-center py-2.5 text-sm font-medium focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(q => q + product.minOrder)}
                  className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Total: <span className="font-bold text-black text-lg">${totalPrice.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Stock */}
          <p className="mt-4 text-[12px]">
            {product.stock > 50 ? (
              <span className="text-gray-600">En stock ({product.stock} disponibles)</span>
            ) : product.stock > 0 ? (
              <span className="text-gray-600">Ultimas unidades ({product.stock} disponibles)</span>
            ) : (
              <span className="text-gray-400">Sin stock</span>
            )}
          </p>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-[12px] tracking-[0.15em] font-medium transition-all ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {added ? <><Check size={18} /> AGREGADO</> : <><ShoppingCart size={18} /> AGREGAR AL CARRITO</>}
            </button>
            <button className="p-4 border border-gray-200 hover:border-black transition-colors">
              <Heart size={18} />
            </button>
            <button className="p-4 border border-gray-200 hover:border-black transition-colors">
              <Share2 size={18} />
            </button>
          </div>

          {!isAuthenticated && (
            <p className="mt-4 text-[12px] text-gray-500 bg-[#f8f8f8] p-3">
              <Link to="/login" className="underline underline-offset-2 hover:text-black">Inicia sesion</Link> o{' '}
              <Link to="/registro" className="underline underline-offset-2 hover:text-black">registrate</Link> para ver precios exclusivos.
            </p>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <Truck size={20} className="mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-[11px] font-medium">Envio Gratis</p>
              <p className="text-[10px] text-gray-400">+$500.000</p>
            </div>
            <div className="text-center">
              <Shield size={20} className="mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-[11px] font-medium">100% Original</p>
              <p className="text-[10px] text-gray-400">Garantizado</p>
            </div>
            <div className="text-center">
              <RotateCcw size={20} className="mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-[11px] font-medium">Devoluciones</p>
              <p className="text-[10px] text-gray-400">30 dias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'description', label: 'Descripcion' },
            { key: 'specs', label: 'Especificaciones' },
            { key: 'shipping', label: 'Envio' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-[12px] tracking-[0.1em] font-medium transition-colors ${
                activeTab === tab.key ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="py-8 max-w-3xl">
          {activeTab === 'description' && (
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-gray-600">
                <li>Material: {product.material}</li>
                <li>Forma: {product.shape}</li>
                <li>Genero: {product.gender}</li>
                {product.uv && <li>Proteccion: {product.uv}</li>}
                {product.polarized && <li>Lentes polarizados</li>}
                {product.lensColor && <li>Color de lente: {product.lensColor}</li>}
                <li>Incluye estuche y pano de microfibra original</li>
              </ul>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
              {[
                ['Ancho de lente', `${product.specs.lensWidth}mm`],
                ['Ancho de puente', `${product.specs.bridgeWidth}mm`],
                ['Largo de patilla', `${product.specs.templeLength}mm`],
                ['Alto de lente', `${product.specs.lensHeight}mm`],
                ['Material', product.material],
                ['Forma', product.shape],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-sm text-gray-600">
              <div className="bg-[#f8f8f8] p-5">
                <h4 className="font-semibold mb-2">Envio a todo el pais</h4>
                <ul className="space-y-1">
                  <li>CABA y GBA: 24-48 horas habiles</li>
                  <li>Interior: 3-5 dias habiles</li>
                  <li>Envio gratis en pedidos superiores a $500.000</li>
                </ul>
              </div>
              <div className="bg-[#f8f8f8] p-5">
                <h4 className="font-semibold mb-2">Metodos de envio</h4>
                <ul className="space-y-1">
                  <li>Correo Argentino</li>
                  <li>OCA</li>
                  <li>Andreani</li>
                  <li>Retiro en showroom (CABA)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 pt-10 border-t border-gray-100">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Productos Relacionados</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
