import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Glasses, UserPlus, Check } from 'lucide-react';
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
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
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
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-surface">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">¡Registro Exitoso!</h2>
          <p className="text-gray-500 mb-2">Tu cuenta ha sido creada correctamente.</p>
          <p className="text-sm text-gray-400">Nuestro equipo revisará tu solicitud y te contactará dentro de las próximas 24-48 horas hábiles para activar tu cuenta mayorista.</p>
          <p className="text-sm text-gray-400 mt-4">Redirigiendo al inicio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Glasses size={48} className="mx-auto text-accent mb-3" />
          <h1 className="text-3xl font-bold text-primary">Registro Mayorista</h1>
          <p className="text-gray-500 mt-2">Completá tus datos para crear tu cuenta</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input name="name" value={formData.name} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social / Empresa *</label>
                <input name="company" value={formData.company} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Óptica Central SRL" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CUIT *</label>
                <input name="cuit" value={formData.cuit} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="30-12345678-9" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input name="phone" value={formData.phone} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="+54 11 1234-5678" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="tu@empresa.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input name="address" value={formData.address} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Av. Corrientes 1234" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <input name="city" value={formData.city} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Buenos Aires" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                <select name="province" value={formData.province} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent">
                  <option value="">Seleccionar...</option>
                  {['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña *</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Repetir contraseña" />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer mt-4">
              <input type="checkbox" required className="accent-accent w-4 h-4 mt-1" />
              <span className="text-sm text-gray-600">
                Acepto los <a href="#" className="text-accent hover:underline">Términos y Condiciones</a> y la{' '}
                <a href="#" className="text-accent hover:underline">Política de Privacidad</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-4 rounded-lg font-semibold text-lg hover:bg-accent-hover transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <span className="animate-pulse">Creando cuenta...</span> : <><UserPlus size={20} /> Crear Cuenta Mayorista</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
