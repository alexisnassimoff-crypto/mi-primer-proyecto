import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', company: '', cuit: '', email: '', phone: '', address: '', city: '', province: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = register(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 3000);
      }
      setLoading(false);
    }, 1000);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-3">REGISTRO EXITOSO</h2>
          <p className="text-sm text-gray-500 mb-2">Tu cuenta ha sido creada correctamente.</p>
          <p className="text-[12px] text-gray-400">Nuestro equipo revisara tu solicitud y te contactara dentro de las proximas 24-48 horas habiles.</p>
          <p className="text-[12px] text-gray-400 mt-4">Redirigiendo al inicio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black tracking-tight">ALTA DE CLIENTE</h1>
          <p className="text-sm text-gray-400 mt-2">Completa tus datos para crear tu cuenta mayorista</p>
        </div>

        <div className="border border-gray-100 p-8 md:p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 mb-6 text-[12px]">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Nombre Completo *</label>
                <input name="name" value={formData.name} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Juan Perez" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Razon Social / Empresa *</label>
                <input name="company" value={formData.company} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Optica Central SRL" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">CUIT *</label>
                <input name="cuit" value={formData.cuit} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="30-12345678-9" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Telefono *</label>
                <input name="phone" value={formData.phone} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="+54 11 1234-5678" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Email *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="tu@empresa.com" />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Direccion *</label>
              <input name="address" value={formData.address} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Av. Corrientes 1234" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Ciudad *</label>
                <input name="city" value={formData.city} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Buenos Aires" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Provincia *</label>
                <select name="province" value={formData.province} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors">
                  <option value="">Seleccionar...</option>
                  {['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba', 'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucuman'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Contrasena *</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Minimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Confirmar Contrasena *</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Repetir contrasena" />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <input type="checkbox" required className="accent-black w-3.5 h-3.5 mt-0.5" />
              <span className="text-[12px] text-gray-500">
                Acepto los <a href="#" className="underline underline-offset-2 hover:text-black">Terminos y Condiciones</a> y la{' '}
                <a href="#" className="underline underline-offset-2 hover:text-black">Politica de Privacidad</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <span className="animate-pulse">CREANDO CUENTA...</span> : <><UserPlus size={16} /> CREAR CUENTA MAYORISTA</>}
            </button>
          </form>

          <p className="mt-6 text-center text-[12px] text-gray-400">
            Ya tenes cuenta?{' '}
            <Link to="/login" className="text-black font-semibold underline underline-offset-2">Iniciar Sesion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
