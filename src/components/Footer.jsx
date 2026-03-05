import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo */}
          <div>
            <div className="w-14 h-14 rounded-full border border-white/40 flex items-center justify-center mb-4">
              <span className="text-xl">👁️</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">CENTRAL</h3>
            <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mt-1">Your Style, Our Passion</p>
          </div>

          {/* Links col 1 */}
          <div>
            <ul className="space-y-3">
              {[
                { label: 'CONTACTO', to: '/contacto' },
                { label: 'ABOUT US', to: '/nosotros' },
                { label: 'NEWSLETTER', to: '/contacto' },
                { label: 'PREGUNTAS FRECUENTES', to: '/contacto' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs tracking-[0.15em] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links col 2 */}
          <div>
            <ul className="space-y-3">
              {[
                { label: 'CUIDADOS BÁSICOS', to: '/nosotros' },
                { label: 'TÉRMINOS & CONDICIONES', to: '/nosotros' },
                { label: 'POLÍTICA DE GARANTÍA', to: '/nosotros' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs tracking-[0.15em] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="flex items-end">
            <div className="flex gap-4">
              {['IG', 'TK', 'FB', 'WA'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-xs font-medium text-gray-400 hover:text-white hover:border-white transition-all"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 text-center">
          <p className="text-[10px] tracking-[0.2em] text-gray-600">
            &copy; 2026 CENTRAL EYEWEAR. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </div>
    </footer>
  );
}
