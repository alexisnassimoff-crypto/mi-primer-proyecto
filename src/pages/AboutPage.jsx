import { Link } from 'react-router-dom';
import { Award, Users, Truck, Clock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] bg-black overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=1600&h=600&fit=crop"
          alt="About CENTRAL"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">ABOUT US</h1>
            <p className="text-base md:text-lg text-gray-300 font-light max-w-2xl mx-auto px-6">
              Mas de 15 anos siendo el distribuidor mayorista de anteojos de confianza para opticas de todo el pais.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-8">Nuestra Historia</h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                CENTRAL-Eyewear nacio en 2010 con una vision clara: democratizar el acceso a anteojos de marcas premium
                para opticas y revendedores en toda Argentina.
              </p>
              <p>
                Comenzamos como una pequena distribuidora en Buenos Aires y hoy somos uno de los principales
                referentes del mercado mayorista de eyewear, atendiendo a mas de 500 clientes en todo el pais.
              </p>
              <p>
                Nuestro compromiso es ofrecer productos 100% originales, precios competitivos y un servicio
                de excelencia que permita a nuestros clientes hacer crecer sus negocios.
              </p>
            </div>
          </div>
          <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&h=600&fit=crop"
              alt="Nuestra historia"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#f8f8f8] py-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-3xl font-black tracking-tight text-center mb-12">Nuestros Valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Autenticidad', desc: 'Todos nuestros productos son 100% originales con garantia de las marcas.' },
              { title: 'Compromiso', desc: 'Nos comprometemos con cada cliente para ofrecer la mejor experiencia de compra.' },
              { title: 'Pasion', desc: 'Amamos lo que hacemos y eso se refleja en cada detalle de nuestro servicio.' },
              { title: 'Excelencia', desc: 'Buscamos la excelencia en cada proceso, desde la seleccion hasta la entrega.' },
            ].map(value => (
              <div key={value.title} className="text-center">
                <h3 className="text-sm font-bold tracking-[0.1em] uppercase mb-3">{value.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: <Award size={28} strokeWidth={1.5} />, value: '15+', label: 'Anos de experiencia' },
            { icon: <Users size={28} strokeWidth={1.5} />, value: '500+', label: 'Clientes activos' },
            { icon: <Truck size={28} strokeWidth={1.5} />, value: '10.000+', label: 'Pedidos entregados' },
            { icon: <Clock size={28} strokeWidth={1.5} />, value: '24hs', label: 'Tiempo de despacho' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex justify-center mb-3 text-gray-400">{stat.icon}</div>
              <p className="text-3xl font-black tracking-tight">{stat.value}</p>
              <p className="text-[12px] text-gray-400 mt-1 tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us - dark section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-3xl font-black tracking-tight text-center mb-12">Por que elegirnos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Precios Competitivos', desc: 'Los mejores precios mayoristas del mercado con descuentos por volumen de hasta el 30%.' },
              { title: 'Catalogo Amplio', desc: 'Mas de 1.000 modelos de las 10 marcas mas reconocidas del mundo en un solo lugar.' },
              { title: 'Atencion Personalizada', desc: 'Equipo de asesores dedicados para ayudarte a elegir los mejores productos para tu negocio.' },
            ].map(item => (
              <div key={item.title} className="border border-white/10 p-8">
                <h3 className="text-sm font-bold tracking-[0.1em] uppercase mb-3">{item.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black tracking-tight mb-4">Listo para trabajar con nosotros?</h2>
        <p className="text-sm text-gray-400 mb-10 max-w-xl mx-auto">
          Unite a nuestra red de mas de 500 opticas y revendedores en todo el pais.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/registro" className="bg-black text-white px-10 py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors">
            CREAR CUENTA
          </Link>
          <Link to="/contacto" className="border border-black px-10 py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors">
            CONTACTANOS
          </Link>
        </div>
      </section>
    </div>
  );
}
