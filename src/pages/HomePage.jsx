import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Send } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

export default function HomePage() {
  const newArrivals = products.filter(p => p.newArrival).slice(0, 4);
  const featuredProducts = products.filter(p => p.featured).slice(0, 6);

  return (
    <div>
      {/* Hero Section - Full width lifestyle image */}
      <section className="relative h-[70vh] md:h-[85vh] bg-gradient-to-br from-amber-100 via-stone-200 to-stone-300 overflow-hidden">
        {/* Overlay with models silhouette feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10">
            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-4 drop-shadow-lg">
              CENTRAL
            </h1>
            <p className="text-lg md:text-xl tracking-[0.3em] font-light uppercase drop-shadow-md">
              Your Style, Our Passion
            </p>
            <Link
              to="/productos"
              className="inline-block mt-8 border border-white px-10 py-3 text-sm tracking-[0.2em] hover:bg-white hover:text-black transition-all"
            >
              EXPLORAR
            </Link>
          </div>
        </div>
        {/* Decorative large glasses */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[180px] md:text-[280px] opacity-20 select-none">
          🕶️
        </div>
      </section>

      {/* Categories - 3 columns */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: 'DE SOL',
                emoji: '🕶️',
                link: '/productos?categoria=anteojos-de-sol',
                bg: 'from-amber-50 to-orange-50',
              },
              {
                label: 'DE RECETA',
                emoji: '👓',
                link: '/productos?categoria=armazones-opticos',
                bg: 'from-green-50 to-emerald-50',
              },
              {
                label: 'ACCESORIOS',
                emoji: '🧴',
                link: '/productos?categoria=accesorios',
                bg: 'from-blue-50 to-sky-50',
              },
            ].map((cat) => (
              <Link
                key={cat.label}
                to={cat.link}
                className="group text-center"
              >
                <div className={`aspect-square bg-gradient-to-br ${cat.bg} flex items-center justify-center mb-6 overflow-hidden`}>
                  <span className="text-[120px] md:text-[160px] opacity-70 group-hover:scale-110 transition-transform duration-500">
                    {cat.emoji}
                  </span>
                </div>
                <div className="inline-block border border-black px-8 py-3">
                  <span className="text-sm tracking-[0.2em] font-medium">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Two column lifestyle images */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-[4/5] bg-gradient-to-br from-stone-200 to-amber-100 relative overflow-hidden flex items-center justify-center">
          <span className="text-[200px] opacity-30">🧑</span>
          <div className="absolute bottom-8 left-8">
            <p className="text-xs tracking-[0.2em] text-gray-600 uppercase">Colección</p>
            <p className="text-2xl font-bold mt-1">HOMBRE</p>
          </div>
        </div>
        <div className="aspect-[4/5] bg-gradient-to-br from-sky-100 to-indigo-100 relative overflow-hidden flex items-center justify-center">
          <span className="text-[200px] opacity-30">👩</span>
          <div className="absolute bottom-8 left-8">
            <p className="text-xs tracking-[0.2em] text-gray-600 uppercase">Colección</p>
            <p className="text-2xl font-bold mt-1">MUJER</p>
          </div>
        </div>
      </section>

      {/* Black CTA banner */}
      <section className="bg-black text-white py-16 relative overflow-hidden">
        {/* Wave pattern decoration */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
            {[...Array(20)].map((_, i) => (
              <path
                key={i}
                d={`M0,${200 + i * 10} Q360,${150 + i * 15} 720,${200 + i * 10} T1440,${200 + i * 10}`}
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
          {/* Eye logo */}
          <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center shrink-0">
            <span className="text-3xl">👁️</span>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xl md:text-2xl tracking-[0.1em] font-light">
              ¿QUERÉS VENDER CENTRAL?{' '}
              <Link to="/contacto" className="font-bold underline underline-offset-4 hover:opacity-80 transition-opacity">
                ESCRIBINOS
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">NEW ARRIVALS</h2>
            <Link
              to="/productos?nuevos=true"
              className="hidden md:flex items-center gap-2 text-sm tracking-[0.15em] font-medium hover:opacity-60 transition-opacity"
            >
              VER TODO <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link
            to="/productos?nuevos=true"
            className="md:hidden mt-8 block text-center text-sm tracking-[0.15em] font-medium"
          >
            VER TODO →
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">BEST SELLERS</h2>
            <Link
              to="/productos"
              className="hidden md:flex items-center gap-2 text-sm tracking-[0.15em] font-medium hover:opacity-60 transition-opacity"
            >
              VER TODO <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Store Locator */}
      <section className="relative py-20 md:py-32 bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
        {/* Map-like background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="max-w-xl ml-auto text-right">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              LOCALIZADOR DE TIENDAS
            </h2>
            <p className="text-lg text-gray-300 font-light">
              Ingresá tu código postal y encontrá tu óptica más cercana
            </p>
            <div className="mt-8 flex gap-0 max-w-md ml-auto">
              <input
                type="text"
                placeholder="Tu código postal"
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/30 text-white placeholder:text-gray-400 text-sm outline-none focus:border-white transition-colors"
              />
              <button className="px-6 py-3.5 bg-white text-black text-sm font-medium tracking-[0.1em] hover:bg-gray-200 transition-colors flex items-center gap-2">
                <MapPin size={16} /> BUSCAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 border-b">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight shrink-0">
              SUSCRIBITE A NUESTRO NEWSLETTER
            </h3>
            <form className="flex gap-0 w-full max-w-lg" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="TU CORREO ELECTRÓNICO"
                className="flex-1 px-5 py-3.5 border border-gray-300 text-sm tracking-wider placeholder:text-gray-400 outline-none focus:border-black transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-black text-white text-sm tracking-[0.15em] font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                ENVIAR <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
