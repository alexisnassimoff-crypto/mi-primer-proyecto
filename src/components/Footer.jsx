import { Link } from 'react-router-dom';
import { Glasses, Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Glasses size={28} className="text-gold" />
              <span className="text-xl font-bold font-[var(--font-display)]">CENTRAL-Eyewear</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Distribuidor mayorista líder en anteojos de las mejores marcas.
              Más de 15 años abasteciendo ópticas en todo el país.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gold">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              {[
                { label: 'Productos', to: '/productos' },
                { label: 'Marcas', to: '/marcas' },
                { label: 'Nuevos Ingresos', to: '/productos?nuevos=true' },
                { label: 'Ofertas', to: '/productos?ofertas=true' },
                { label: 'Nosotros', to: '/nosotros' },
                { label: 'Contacto', to: '/contacto' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-300 hover:text-gold transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gold">Categorías</h3>
            <ul className="space-y-2">
              {[
                { label: 'Anteojos de Sol', to: '/productos?categoria=anteojos-de-sol' },
                { label: 'Armazones Ópticos', to: '/productos?categoria=armazones-opticos' },
                { label: 'Anteojos Deportivos', to: '/productos?categoria=anteojos-deportivos' },
                { label: 'Anteojos de Lectura', to: '/productos?categoria=anteojos-de-lectura' },
                { label: 'Lentes de Contacto', to: '/productos?categoria=lentes-de-contacto' },
                { label: 'Accesorios', to: '/productos?categoria=accesorios' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-300 hover:text-gold transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gold">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin size={16} className="shrink-0 mt-0.5" />
                Av. Corrientes 5678, Piso 3, CABA, Argentina
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Phone size={16} className="shrink-0" />
                +54 11 4567-8900
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Mail size={16} className="shrink-0" />
                ventas@central-eyewear.com
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Clock size={16} className="shrink-0" />
                Lun-Vie: 9:00 - 18:00
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; 2026 CENTRAL-Eyewear. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a href="#" className="hover:text-gold transition-colors">Términos y Condiciones</a>
            <a href="#" className="hover:text-gold transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
