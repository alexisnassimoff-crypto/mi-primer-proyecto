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
      <section className="relative h-[70vh] md:h-[90vh] bg-black overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&h=900&fit=crop&crop=faces"
          alt="Hero lifestyle"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10">
            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-4">
              CENTRAL
            </h1>
            <p className="text-base md:text-lg tracking-[0.4em] font-light uppercase">
              Your Style, Our Passion
            </p>
            <Link
              to="/productos"
              className="inline-block mt-10 border border-white px-12 py-3.5 text-[12px] tracking-[0.25em] font-medium hover:bg-white hover:text-black transition-all duration-300"
            >
              EXPLORAR
            </Link>
          </div>
        </div>
      </section>

      {/* Categories - 3 columns with lifestyle images */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'DE SOL',
                image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=750&fit=crop',
                link: '/productos?categoria=anteojos-de-sol',
              },
              {
                label: 'DE RECETA',
                image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=750&fit=crop',
                link: '/productos?categoria=armazones-opticos',
              },
              {
                label: 'ACCESORIOS',
                image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&h=750&fit=crop',
                link: '/productos?categoria=accesorios',
              },
            ].map((cat) => (
              <Link
                key={cat.label}
                to={cat.link}
                className="group text-center"
              >
                <div className="aspect-[4/5] bg-[#f5f5f5] overflow-hidden mb-6 relative">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="inline-block border border-black px-8 py-3">
                  <span className="text-[12px] tracking-[0.25em] font-medium">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Two column lifestyle images - Men / Women */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <Link to="/productos?genero=hombre" className="group relative aspect-[4/5] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop&crop=faces"
            alt="Coleccion Hombre"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          <div className="absolute bottom-8 left-8 text-white">
            <p className="text-[11px] tracking-[0.25em] uppercase font-light mb-1">Coleccion</p>
            <p className="text-3xl font-bold tracking-tight">HOMBRE</p>
          </div>
        </Link>
        <Link to="/productos?genero=mujer" className="group relative aspect-[4/5] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&crop=faces"
            alt="Coleccion Mujer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          <div className="absolute bottom-8 left-8 text-white">
            <p className="text-[11px] tracking-[0.25em] uppercase font-light mb-1">Coleccion</p>
            <p className="text-3xl font-bold tracking-tight">MUJER</p>
          </div>
        </Link>
      </section>

      {/* Black CTA banner */}
      <section className="bg-black text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
            {[...Array(15)].map((_, i) => (
              <path
                key={i}
                d={`M0,${200 + i * 12} Q360,${150 + i * 15} 720,${200 + i * 12} T1440,${200 + i * 12}`}
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
          <div className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center shrink-0">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 8C1 8 5 1 12 1C19 1 23 8 23 8C23 8 19 15 12 15C5 15 1 8 1 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="8" r="3" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="text-lg md:text-xl tracking-[0.05em] font-light text-center md:text-left">
            QUERES VENDER CENTRAL?{' '}
            <Link to="/contacto" className="font-bold underline underline-offset-4 hover:opacity-80 transition-opacity">
              ESCRIBINOS
            </Link>
          </p>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">NEW ARRIVALS</h2>
            <Link
              to="/productos?nuevos=true"
              className="hidden md:flex items-center gap-2 text-[12px] tracking-[0.15em] font-medium hover:opacity-60 transition-opacity"
            >
              VER TODO <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link
            to="/productos?nuevos=true"
            className="md:hidden mt-8 block text-center text-[12px] tracking-[0.15em] font-medium"
          >
            VER TODO
          </Link>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-[#f8f8f8] py-20 md:py-32">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">BEST SELLERS</h2>
            <Link
              to="/productos"
              className="hidden md:flex items-center gap-2 text-[12px] tracking-[0.15em] font-medium hover:opacity-60 transition-opacity"
            >
              VER TODO <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Store Locator */}
      <section className="relative py-20 md:py-32 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 relative z-10">
          <div className="max-w-xl ml-auto text-right">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              LOCALIZADOR DE TIENDAS
            </h2>
            <p className="text-base text-gray-400 font-light">
              Ingresa tu codigo postal y encontra tu optica mas cercana
            </p>
            <div className="mt-8 flex gap-0 max-w-md ml-auto">
              <input
                type="text"
                placeholder="Tu codigo postal"
                className="flex-1 px-5 py-3.5 bg-white/5 border border-white/20 text-white placeholder:text-gray-500 text-sm outline-none focus:border-white/50 transition-colors"
              />
              <button className="px-6 py-3.5 bg-white text-black text-[11px] font-medium tracking-[0.1em] hover:bg-gray-200 transition-colors flex items-center gap-2">
                <MapPin size={14} /> BUSCAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <h3 className="text-lg md:text-xl font-bold tracking-tight shrink-0">
              SUSCRIBITE A NUESTRO NEWSLETTER
            </h3>
            <form className="flex gap-0 w-full max-w-lg" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="TU CORREO ELECTRONICO"
                className="flex-1 px-5 py-3.5 border border-gray-200 text-[12px] tracking-wider placeholder:text-gray-400 outline-none focus:border-black transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-black text-white text-[11px] tracking-[0.15em] font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                ENVIAR <Send size={12} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
