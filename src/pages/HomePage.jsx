import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Award, Clock, TrendingUp, Users, Package } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products, brands, categories } from '../data/products';

export default function HomePage() {
  const featuredProducts = products.filter(p => p.featured).slice(0, 8);
  const newArrivals = products.filter(p => p.newArrival).slice(0, 4);
  const bestSellers = products.filter(p => p.bestSeller).slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary-light text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 text-[200px]">👓</div>
          <div className="absolute bottom-10 right-20 text-[150px]">🕶️</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1 bg-gold/20 text-gold rounded-full text-sm font-medium mb-4">
              Distribuidor Mayorista Oficial
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-[var(--font-display)]">
              Anteojos de las
              <span className="text-gold"> Mejores Marcas</span>
              <br />al Mejor Precio
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Más de 1.000 modelos de marcas premium. Precios exclusivos para ópticas y revendedores.
              Envíos a todo el país.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/productos" className="bg-accent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-hover transition-colors flex items-center gap-2">
                Ver Catálogo <ArrowRight size={20} />
              </Link>
              <Link to="/registro" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-colors">
                Crear Cuenta Mayorista
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="bg-surface border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Truck size={24} />, title: 'Envío Gratis', desc: 'En pedidos +$500.000' },
              { icon: <Shield size={24} />, title: '100% Originales', desc: 'Garantía de autenticidad' },
              { icon: <Award size={24} />, title: 'Precios Mayoristas', desc: 'Hasta 70% off retail' },
              { icon: <Clock size={24} />, title: 'Entrega Rápida', desc: '24-48hs en CABA/GBA' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="text-accent shrink-0">{item.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Categorías</h2>
          <p className="text-gray-500 mt-2">Encontrá lo que necesitás para tu óptica</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/productos?categoria=${cat.slug}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all text-center group border border-gray-100 hover:border-accent"
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <h3 className="font-semibold text-sm text-gray-800 group-hover:text-accent transition-colors">{cat.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Productos Destacados</h2>
              <p className="text-gray-500 mt-2">Los más elegidos por nuestros clientes</p>
            </div>
            <Link to="/productos" className="hidden md:flex items-center gap-1 text-accent font-semibold hover:underline">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link to="/productos" className="md:hidden mt-6 block text-center text-accent font-semibold">
            Ver todos los productos →
          </Link>
        </div>
      </section>

      {/* Brands */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Nuestras Marcas</h2>
          <p className="text-gray-500 mt-2">Trabajamos con las marcas más reconocidas del mundo</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/productos?marca=${brand.slug}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all text-center group border border-gray-100 hover:border-gold"
            >
              <div className="text-3xl mb-2">{brand.logo}</div>
              <h3 className="font-bold text-gray-800 group-hover:text-gold transition-colors">{brand.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {products.filter(p => p.brandId === brand.id).length} productos
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals + Best Sellers */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <TrendingUp className="text-green-500" size={24} /> Nuevos Ingresos
                </h2>
                <Link to="/productos?nuevos=true" className="text-accent text-sm font-semibold hover:underline">Ver más →</Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {newArrivals.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Award className="text-gold" size={24} /> Más Vendidos
                </h2>
                <Link to="/productos?ofertas=true" className="text-accent text-sm font-semibold hover:underline">Ver más →</Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {bestSellers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Package size={32} />, value: '1.000+', label: 'Productos' },
              { icon: <Award size={32} />, value: '10+', label: 'Marcas Premium' },
              { icon: <Users size={32} />, value: '500+', label: 'Clientes Mayoristas' },
              { icon: <Truck size={32} />, value: '15+', label: 'Años de Experiencia' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-gold flex justify-center mb-2">{stat.icon}</div>
                <p className="text-3xl md:text-4xl font-bold text-gold">{stat.value}</p>
                <p className="text-gray-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-accent to-accent-hover rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Sos dueño de una óptica?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Registrate como cliente mayorista y accedé a precios exclusivos,
            descuentos por volumen y atención personalizada.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/registro" className="bg-white text-accent px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
              Crear Cuenta Mayorista
            </Link>
            <Link to="/contacto" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
              Contactanos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
