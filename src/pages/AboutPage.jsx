import { Link } from 'react-router-dom';
import { Award, Users, Truck, Shield, Target, Heart, Clock, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre CENTRAL-Eyewear</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Más de 15 años siendo el distribuidor mayorista de anteojos de confianza para ópticas de todo el país.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">Nuestra Historia</h2>
            <p className="text-gray-600 mb-4">
              CENTRAL-Eyewear nació en 2010 con una visión clara: democratizar el acceso a anteojos de marcas premium
              para ópticas y revendedores en toda Argentina.
            </p>
            <p className="text-gray-600 mb-4">
              Comenzamos como una pequeña distribuidora en Buenos Aires y hoy somos uno de los principales
              referentes del mercado mayorista de eyewear, atendiendo a más de 500 clientes en todo el país.
            </p>
            <p className="text-gray-600">
              Nuestro compromiso es ofrecer productos 100% originales, precios competitivos y un servicio
              de excelencia que permita a nuestros clientes hacer crecer sus negocios.
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-12 text-center">
            <span className="text-[120px]">👓</span>
            <p className="text-gray-500 mt-4 font-medium">Desde 2010 al servicio de la óptica argentina</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-primary text-center mb-10">Nuestros Valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield size={32} />, title: 'Autenticidad', desc: 'Todos nuestros productos son 100% originales con garantía de las marcas.' },
              { icon: <Target size={32} />, title: 'Compromiso', desc: 'Nos comprometemos con cada cliente para ofrecer la mejor experiencia de compra.' },
              { icon: <Heart size={32} />, title: 'Pasión', desc: 'Amamos lo que hacemos y eso se refleja en cada detalle de nuestro servicio.' },
              { icon: <CheckCircle size={32} />, title: 'Excelencia', desc: 'Buscamos la excelencia en cada proceso, desde la selección hasta la entrega.' },
            ].map(value => (
              <div key={value.title} className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-accent mx-auto mb-4 flex justify-center">{value.icon}</div>
                <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: <Award size={36} />, value: '15+', label: 'Años de experiencia' },
            { icon: <Users size={36} />, value: '500+', label: 'Clientes activos' },
            { icon: <Truck size={36} />, value: '10.000+', label: 'Pedidos entregados' },
            { icon: <Clock size={36} />, value: '24hs', label: 'Tiempo de despacho' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-gold flex justify-center mb-2">{stat.icon}</div>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">¿Por qué elegirnos?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Precios Competitivos', desc: 'Ofrecemos los mejores precios mayoristas del mercado con descuentos por volumen de hasta el 30%.' },
              { title: 'Catálogo Amplio', desc: 'Más de 1.000 modelos de las 10 marcas más reconocidas del mundo en un solo lugar.' },
              { title: 'Atención Personalizada', desc: 'Equipo de asesores dedicados para ayudarte a elegir los mejores productos para tu negocio.' },
            ].map(item => (
              <div key={item.title} className="bg-white/10 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gold mb-3">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">¿Listo para trabajar con nosotros?</h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
          Unite a nuestra red de más de 500 ópticas y revendedores en todo el país.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/registro" className="bg-accent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-hover transition-colors">
            Crear Cuenta Mayorista
          </Link>
          <Link to="/contacto" className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary hover:text-white transition-colors">
            Contactanos
          </Link>
        </div>
      </section>
    </div>
  );
}
