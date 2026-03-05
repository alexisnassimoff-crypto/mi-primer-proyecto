import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();
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
    { label: 'CLIP ON', to: '/productos?categoria=accesorios' },
    { label: 'TIENDAS', to: '/contacto' },
    { label: 'NEW ARRIVALS', to: '/productos?nuevos=true' },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top banner */}
      <div className="bg-black text-white text-center py-2.5 overflow-hidden">
        <p className="text-[10px] tracking-[0.3em] uppercase font-light animate-pulse">
          COMPRAS ONLINE | DESCUENTO EXCLUSIVO PAGANDO EN EFECTIVO O TRANSFERENCIA
        </p>
      </div>

      {/* Main header */}
      <div className="bg-white">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <h1 className="text-[22px] font-black tracking-[0.02em] leading-none">
              CENTRAL
            </h1>
            <span className="text-[7px] tracking-[0.35em] text-gray-400 uppercase font-light block mt-0.5">
              YOUR STYLE, OUR PASSION
            </span>
          </Link>

          {/* Navigation - desktop */}
          <nav className="hidden lg:flex items-center gap-12">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-[13px] tracking-[0.12em] font-medium text-black hover:opacity-50 transition-opacity"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:opacity-50 transition-opacity"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <Link to="/carrito" className="relative hover:opacity-50 transition-opacity">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <Link
              to={isAuthenticated ? '/mi-cuenta' : '/login'}
              className="hidden sm:block border border-black rounded-full px-7 py-2.5 text-[11px] tracking-[0.15em] font-medium hover:bg-black hover:text-white transition-all duration-300"
            >
              {isAuthenticated ? (user?.company || 'MI CUENTA') : 'LOG IN'}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden hover:opacity-50 transition-opacity"
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="border-t border-gray-100">
            <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-5">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <Search size={18} className="text-gray-300 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 text-sm outline-none placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-300 hover:text-black"
                >
                  <X size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-8 py-8 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="block py-4 text-[13px] tracking-[0.15em] font-medium text-black border-b border-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/nosotros"
              className="block py-4 text-[13px] tracking-[0.15em] font-medium text-black border-b border-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              NOSOTROS
            </Link>
            <Link
              to={isAuthenticated ? '/mi-cuenta' : '/login'}
              className="block py-4 text-[13px] tracking-[0.15em] font-medium text-black"
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
