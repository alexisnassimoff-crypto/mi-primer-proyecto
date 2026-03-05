import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-[85vh] grid md:grid-cols-2">
      {/* Left - Lifestyle image */}
      <div className="hidden md:block relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1508296695146-257a814070b4?w=900&h=1200&fit=crop&crop=faces"
          alt="Eyewear lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right - Login form */}
      <div className="flex items-center justify-center px-8 md:px-16 lg:px-24 py-20">
        <div className="w-full max-w-sm">
          {/* Demo credentials */}
          <div className="bg-[#f8f8f8] p-4 mb-10 text-center">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1">Cuenta Demo</p>
            <p className="text-[12px] text-gray-400">demo@central-eyewear.com / demo123</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 mb-8 text-[12px] text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="NOMBRE DE USUARIO"
                required
                className="w-full px-6 py-4 border border-gray-200 rounded-full text-[12px] tracking-[0.1em] text-center placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CLAVE"
                required
                className="w-full px-6 py-4 border border-gray-200 rounded-full text-[12px] tracking-[0.1em] text-center placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full text-[12px] tracking-[0.25em] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'INGRESANDO...' : 'INGRESAR'}
            </button>
          </form>

          <div className="mt-10 text-center space-y-5">
            <div className="border-b border-gray-100 pb-5">
              <a href="#" className="text-[12px] text-gray-400 hover:text-black transition-colors">
                Olvidaste tu clave? <span className="underline underline-offset-2">Restablecer</span>
              </a>
            </div>
            <p className="text-[12px] text-gray-400">
              Todavia no creaste tu cuenta?{' '}
              <Link to="/registro" className="underline underline-offset-2 hover:text-black transition-colors">
                Registrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
