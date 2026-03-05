import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center">
                <svg width="16" height="11" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 8C1 8 5 1 12 1C19 1 23 8 23 8C23 8 19 15 12 15C5 15 1 8 1 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="8" r="3" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">CENTRAL</h3>
                <p className="text-[8px] tracking-[0.3em] text-gray-500 uppercase">Your Style, Our Passion</p>
              </div>
            </div>
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
                    className="text-[11px] tracking-[0.15em] text-gray-400 hover:text-white transition-colors"
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
                { label: 'CUIDADOS BASICOS', to: '/nosotros' },
                { label: 'TERMINOS & CONDICIONES', to: '/nosotros' },
                { label: 'POLITICA DE GARANTIA', to: '/nosotros' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[11px] tracking-[0.15em] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="flex items-end">
            <div className="flex gap-3">
              {['IG', 'TK', 'FB', 'WA'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium text-gray-500 hover:text-white hover:border-white transition-all"
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
