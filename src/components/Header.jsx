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
      <div className="bg-black text-white text-center py-2.5">
        <p className="text-xs tracking-[0.2em] uppercase font-light">
          Beneficios Exclusivos para Ópticas
        </p>
      </div>

      {/* Main header */}
      <div className="bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              CENTRAL
            </h1>
            <span className="text-[9px] tracking-[0.3em] text-gray-500 uppercase font-light">
              Your Style, Our Passion
            </span>
          </Link>

          {/* Navigation - desktop */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm tracking-[0.15em] font-medium text-gray-800 hover:text-black transition-colors"
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
              <Search size={20} strokeWidth={1.5} />
            </button>

            <Link
              to={isAuthenticated ? '/mi-cuenta' : '/login'}
              className="hidden sm:block border border-black px-6 py-2.5 text-xs tracking-[0.15em] font-medium hover:bg-black hover:text-white transition-all"
            >
              LOG IN
            </Link>

            <Link to="/carrito" className="relative hover:opacity-60 transition-opacity">
              <ShoppingCart size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden hover:opacity-60 transition-opacity"
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="border-t border-gray-100">
            <div className="max-w-[1400px] mx-auto px-6 py-4">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <Search size={18} className="text-gray-400 shrink-0" />
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
          <div className="px-6 py-6 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="block py-3 text-sm tracking-[0.15em] font-medium text-gray-800 border-b border-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/productos"
              className="block py-3 text-sm tracking-[0.15em] font-medium text-gray-800 border-b border-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              TODOS LOS PRODUCTOS
            </Link>
            <Link
              to="/nosotros"
              className="block py-3 text-sm tracking-[0.15em] font-medium text-gray-800 border-b border-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              NOSOTROS
            </Link>
            <Link
              to={isAuthenticated ? '/mi-cuenta' : '/login'}
              className="block py-3 text-sm tracking-[0.15em] font-medium text-gray-800"
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
