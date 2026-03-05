import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuItems = [
    { label: 'CUENTA', active: true },
    { label: 'CLAVES' },
    { label: 'PEDIDOS' },
    { label: 'DESCARGAS' },
    { label: 'AYUDA' },
  ];

  const accountFields = [
    { label: 'Optica', value: user.company || 'Mi Optica' },
    { label: 'Responsable', value: user.name },
    { label: 'CUIT', value: user.cuit || '20-00000000-0' },
    { label: 'Direccion del Local', value: user.address || 'Sin direccion' },
    { label: 'Telefono', value: user.phone || '+54 11 0000-0000' },
    { label: 'WhatsApp', value: user.phone || '+54 11 0000-0000' },
    { label: 'Email', value: user.email },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-16 md:py-24">
      <div className="grid lg:grid-cols-[220px_1fr] gap-16 lg:gap-24">
        {/* Sidebar */}
        <div className="space-y-3">
          {menuItems.map(item => (
            <button
              key={item.label}
              className={`w-full text-right px-6 py-4 text-[13px] tracking-[0.1em] font-medium transition-colors ${
                item.active
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-black hover:bg-black hover:text-white hover:border-black'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={logout}
            className="w-full text-right px-6 py-4 text-[13px] tracking-[0.1em] font-medium text-gray-400 hover:text-black transition-colors flex items-center justify-end gap-2 mt-6"
          >
            <LogOut size={14} /> CERRAR SESION
          </button>
        </div>

        {/* Main content */}
        <div className="space-y-0">
          {accountFields.map((field, i) => (
            <div key={field.label} className="flex items-center justify-between py-6 border-b border-gray-100">
              <div className="flex items-baseline gap-3">
                <span className="text-[13px] text-gray-400 min-w-[140px]">{field.label}</span>
                <span className="text-[14px] font-medium">{field.value}</span>
              </div>
              <button className="text-[12px] text-gray-400 hover:text-black transition-colors tracking-wide">
                Editar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
