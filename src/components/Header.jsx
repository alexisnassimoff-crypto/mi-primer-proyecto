import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos?buscar=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: 'DE SOL', to: '/productos?categoria=anteojos-de-sol' },
    { label: 'DE RECETA', to: '/productos?categoria=armazones-opticos' },
    { label: 'MARCAS', to: '/marcas' },
    { label: 'TIENDAS', to: '/contacto' },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top banner */}
      <div className="bg-black text-white text-center py-2">
        <p className="text-[10px] tracking-[0.25em] uppercase font-light">
          Beneficios Exclusivos para Opticas
        </p>
      </div>

      {/* Main header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center">
              <svg width="18" height="12" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 8C1 8 5 1 12 1C19 1 23 8 23 8C23 8 19 15 12 15C5 15 1 8 1 8Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="8" r="3" stroke="black" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-[0.05em] leading-none">
                CENTRAL
              </h1>
              <span className="text-[8px] tracking-[0.3em] text-gray-400 uppercase font-light">
                Your Style, Our Passion
              </span>
            </div>
          </Link>

          {/* Navigation - desktop */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-[13px] tracking-[0.15em] font-medium text-gray-700 hover:text-black transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:opacity-60 transition-opacity"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <Link
              to={isAuthenticated ? '/mi-cuenta' : '/login'}
              className="hidden sm:block border border-black px-5 py-2 text-[11px] tracking-[0.15em] font-medium hover:bg-black hover:text-white transition-all"
            >
              {isAuthenticated ? 'MI CUENTA' : 'LOG IN'}
            </Link>

            <Link to="/carrito" className="relative hover:opacity-60 transition-opacity">
              <ShoppingCart size={18} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden hover:opacity-60 transition-opacity"
            >
              {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="border-t border-gray-100">
            <div className="max-w-[1400px] mx-auto px-6 py-4">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 text-sm outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-6 py-6 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="block py-3 text-[13px] tracking-[0.15em] font-medium text-gray-700 border-b border-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/productos"
              className="block py-3 text-[13px] tracking-[0.15em] font-medium text-gray-700 border-b border-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              TODOS LOS PRODUCTOS
            </Link>
            <Link
              to="/nosotros"
              className="block py-3 text-[13px] tracking-[0.15em] font-medium text-gray-700 border-b border-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              NOSOTROS
            </Link>
            <Link
              to="/blog"
              className="block py-3 text-[13px] tracking-[0.15em] font-medium text-gray-700 border-b border-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              BLOG
            </Link>
            <Link
              to={isAuthenticated ? '/mi-cuenta' : '/login'}
              className="block py-3 text-[13px] tracking-[0.15em] font-medium text-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              MI CUENTA
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
