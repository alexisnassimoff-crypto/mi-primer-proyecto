import { Link } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, MapPin, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const mockOrders = [
    { id: '#54321', date: '28/02/2026', items: 3, total: 125400, status: 'Entregado' },
    { id: '#54289', date: '15/02/2026', items: 5, total: 287600, status: 'En camino' },
    { id: '#54201', date: '01/02/2026', items: 2, total: 78900, status: 'Procesando' },
  ];

  const statusColors = {
    'Entregado': 'bg-green-100 text-green-700',
    'En camino': 'bg-blue-100 text-blue-700',
    'Procesando': 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">Mi Cuenta</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={36} className="text-accent" />
              </div>
              <h3 className="font-bold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.company}</p>
              {user.approved ? (
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Cuenta Verificada</span>
              ) : (
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">Pendiente de Aprobación</span>
              )}
            </div>
            <nav className="space-y-1 mt-6">
              {[
                { icon: <Package size={18} />, label: 'Mis Pedidos', active: true },
                { icon: <Heart size={18} />, label: 'Favoritos' },
                { icon: <MapPin size={18} />, label: 'Direcciones' },
                { icon: <CreditCard size={18} />, label: 'Datos de Facturación' },
                { icon: <Bell size={18} />, label: 'Notificaciones' },
                { icon: <Settings size={18} />, label: 'Configuración' },
              ].map(item => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    item.active ? 'bg-accent/10 text-accent font-medium' : 'text-gray-600 hover:bg-surface'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Datos de la Cuenta</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Email:</span> <span className="font-medium ml-1">{user.email}</span></div>
              <div><span className="text-gray-500">CUIT:</span> <span className="font-medium ml-1">{user.cuit}</span></div>
              <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium ml-1">{user.phone}</span></div>
              <div><span className="text-gray-500">Dirección:</span> <span className="font-medium ml-1">{user.address}</span></div>
              {user.discount > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Descuento especial:</span>
                  <span className="font-bold text-green-600 ml-1">{user.discount}% en todos los productos</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mis Pedidos</h2>
              <button className="text-sm text-accent hover:underline">Ver todos</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-semibold text-gray-500">Pedido</th>
                    <th className="text-left py-3 font-semibold text-gray-500">Fecha</th>
                    <th className="text-left py-3 font-semibold text-gray-500">Items</th>
                    <th className="text-left py-3 font-semibold text-gray-500">Total</th>
                    <th className="text-left py-3 font-semibold text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map(order => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-surface transition-colors">
                      <td className="py-3 font-medium text-accent">{order.id}</td>
                      <td className="py-3">{order.date}</td>
                      <td className="py-3">{order.items} productos</td>
                      <td className="py-3 font-medium">${order.total.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/productos" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
              <Package size={32} className="mx-auto text-accent mb-2" />
              <p className="font-semibold">Nuevo Pedido</p>
              <p className="text-xs text-gray-400">Explorá el catálogo</p>
            </Link>
            <Link to="/contacto" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
              <Settings size={32} className="mx-auto text-accent mb-2" />
              <p className="font-semibold">Soporte</p>
              <p className="text-xs text-gray-400">Contactá a ventas</p>
            </Link>
            <Link to="/productos?ofertas=true" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
              <Heart size={32} className="mx-auto text-accent mb-2" />
              <p className="font-semibold">Ofertas</p>
              <p className="text-xs text-gray-400">Descuentos especiales</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
