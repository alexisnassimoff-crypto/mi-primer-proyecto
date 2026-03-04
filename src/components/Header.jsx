import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, ChevronDown, Phone, Mail, Glasses } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos?buscar=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="hidden md:flex items-center gap-6">
            <span className="flex items-center gap-1">
              <Phone size={14} /> +54 11 4567-8900
            </span>
            <span className="flex items-center gap-1">
              <Mail size={14} /> ventas@central-eyewear.com
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="hidden sm:inline text-gold font-medium">Envío gratis en pedidos +$500.000</span>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span>Hola, {user.name}</span>
                <button onClick={logout} className="underline hover:text-gold">Salir</button>
              </div>
            ) : (
              <Link to="/login" className="hover:text-gold transition-colors">Iniciar Sesión</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Glasses size={36} className="text-accent" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-primary leading-none font-[var(--font-display)]">
                  CENTRAL-Eyewear
                </h1>
                <span className="text-xs text-gray-500 tracking-widest">VENTA MAYORISTA</span>
              </div>
            </Link>

            {/* Search bar - desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl">
              <div className="flex w-full">
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-5 bg-accent text-white rounded-r-lg hover:bg-accent-hover transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Search size={22} />
              </button>

              <Link
                to={isAuthenticated ? '/mi-cuenta' : '/login'}
                className="hidden sm:flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg"
              >
                <User size={22} />
                <span className="hidden md:inline text-sm">Mi Cuenta</span>
              </Link>

              <Link to="/carrito" className="relative p-2 hover:bg-gray-100 rounded-lg">
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="lg:hidden mt-3">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:border-accent"
                />
                <button type="submit" className="px-5 bg-accent text-white rounded-r-lg">
                  <Search size={20} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Navigation */}
        <nav className="hidden lg:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center gap-1">
              {[
                { label: 'Inicio', to: '/' },
                {
                  label: 'Productos',
                  to: '/productos',
                  children: [
                    { label: 'Anteojos de Sol', to: '/productos?categoria=anteojos-de-sol' },
                    { label: 'Armazones Ópticos', to: '/productos?categoria=armazones-opticos' },
                    { label: 'Anteojos Deportivos', to: '/productos?categoria=anteojos-deportivos' },
                    { label: 'Anteojos de Lectura', to: '/productos?categoria=anteojos-de-lectura' },
                    { label: 'Accesorios', to: '/productos?categoria=accesorios' },
                    { label: 'Ver Todos', to: '/productos' },
                  ],
                },
                {
                  label: 'Marcas',
                  to: '/marcas',
                  children: [
                    { label: 'Ray-Ban', to: '/productos?marca=ray-ban' },
                    { label: 'Oakley', to: '/productos?marca=oakley' },
                    { label: 'Gucci', to: '/productos?marca=gucci' },
                    { label: 'Prada', to: '/productos?marca=prada' },
                    { label: 'Tom Ford', to: '/productos?marca=tom-ford' },
                    { label: 'Ver Todas', to: '/marcas' },
                  ],
                },
                { label: 'Nuevos Ingresos', to: '/productos?nuevos=true' },
                { label: 'Ofertas', to: '/productos?ofertas=true' },
                { label: 'Nosotros', to: '/nosotros' },
                { label: 'Contacto', to: '/contacto' },
              ].map((item) => (
                <li
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() => item.children && setDropdownOpen(item.label)}
                  onMouseLeave={() => setDropdownOpen(null)}
                >
                  <Link
                    to={item.to}
                    className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-accent transition-colors"
                  >
                    {item.label}
                    {item.children && <ChevronDown size={14} />}
                  </Link>
                  {item.children && dropdownOpen === item.label && (
                    <div className="absolute top-full left-0 bg-white shadow-lg rounded-b-lg border border-gray-100 min-w-48 py-2 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.to}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-surface hover:text-accent transition-colors"
                          onClick={() => setDropdownOpen(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {[
              { label: 'Inicio', to: '/' },
              { label: 'Productos', to: '/productos' },
              { label: 'Anteojos de Sol', to: '/productos?categoria=anteojos-de-sol' },
              { label: 'Armazones Ópticos', to: '/productos?categoria=armazones-opticos' },
              { label: 'Marcas', to: '/marcas' },
              { label: 'Nuevos Ingresos', to: '/productos?nuevos=true' },
              { label: 'Ofertas', to: '/productos?ofertas=true' },
              { label: 'Nosotros', to: '/nosotros' },
              { label: 'Contacto', to: '/contacto' },
              { label: 'Mi Cuenta', to: isAuthenticated ? '/mi-cuenta' : '/login' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="block px-4 py-3 text-gray-700 hover:bg-surface rounded-lg font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
