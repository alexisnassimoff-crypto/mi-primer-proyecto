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

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight mb-10">MI CUENTA</h1>

      <div className="grid lg:grid-cols-4 gap-10">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold">{user.name}</h3>
              <p className="text-[12px] text-gray-400">{user.company}</p>
              {user.approved ? (
                <span className="inline-block mt-2 px-3 py-1 bg-black text-white text-[10px] tracking-[0.1em]">VERIFICADA</span>
              ) : (
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-[10px] tracking-[0.1em]">PENDIENTE</span>
              )}
            </div>
            <nav className="space-y-1">
              {[
                { icon: <Package size={16} strokeWidth={1.5} />, label: 'Mis Pedidos', active: true },
                { icon: <Heart size={16} strokeWidth={1.5} />, label: 'Favoritos' },
                { icon: <MapPin size={16} strokeWidth={1.5} />, label: 'Direcciones' },
                { icon: <CreditCard size={16} strokeWidth={1.5} />, label: 'Facturacion' },
                { icon: <Bell size={16} strokeWidth={1.5} />, label: 'Notificaciones' },
                { icon: <Settings size={16} strokeWidth={1.5} />, label: 'Configuracion' },
              ].map(item => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors ${
                    item.active ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-gray-400 hover:text-black transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} /> Cerrar Sesion
              </button>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Account info */}
          <div className="border border-gray-100 p-6">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase mb-5">Datos de la Cuenta</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
              <div><span className="text-gray-400">Email:</span> <span className="font-medium ml-1">{user.email}</span></div>
              <div><span className="text-gray-400">CUIT:</span> <span className="font-medium ml-1">{user.cuit}</span></div>
              <div><span className="text-gray-400">Telefono:</span> <span className="font-medium ml-1">{user.phone}</span></div>
              <div><span className="text-gray-400">Direccion:</span> <span className="font-medium ml-1">{user.address}</span></div>
              {user.discount > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-gray-400">Descuento especial:</span>
                  <span className="font-bold ml-1">{user.discount}% en todos los productos</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div className="border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-bold tracking-[0.1em] uppercase">Mis Pedidos</h2>
              <button className="text-[12px] text-gray-400 underline underline-offset-2 hover:text-black">Ver todos</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-[11px] tracking-[0.1em] font-semibold text-gray-400 uppercase">Pedido</th>
                    <th className="text-left py-3 text-[11px] tracking-[0.1em] font-semibold text-gray-400 uppercase">Fecha</th>
                    <th className="text-left py-3 text-[11px] tracking-[0.1em] font-semibold text-gray-400 uppercase">Items</th>
                    <th className="text-left py-3 text-[11px] tracking-[0.1em] font-semibold text-gray-400 uppercase">Total</th>
                    <th className="text-left py-3 text-[11px] tracking-[0.1em] font-semibold text-gray-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium">{order.id}</td>
                      <td className="py-3 text-gray-500">{order.date}</td>
                      <td className="py-3 text-gray-500">{order.items} productos</td>
                      <td className="py-3 font-medium">${order.total.toLocaleString()}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-[#f5f5f5] text-[11px] tracking-wide font-medium">
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
            <Link to="/productos" className="border border-gray-100 p-6 text-center hover:border-black transition-colors">
              <Package size={24} className="mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Nuevo Pedido</p>
              <p className="text-[11px] text-gray-400 mt-1">Explora el catalogo</p>
            </Link>
            <Link to="/contacto" className="border border-gray-100 p-6 text-center hover:border-black transition-colors">
              <Settings size={24} className="mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Soporte</p>
              <p className="text-[11px] text-gray-400 mt-1">Contacta a ventas</p>
            </Link>
            <Link to="/productos?ofertas=true" className="border border-gray-100 p-6 text-center hover:border-black transition-colors">
              <Heart size={24} className="mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Ofertas</p>
              <p className="text-[11px] text-gray-400 mt-1">Descuentos especiales</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
