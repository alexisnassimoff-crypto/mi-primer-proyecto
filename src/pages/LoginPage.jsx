import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="14" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 8C1 8 5 1 12 1C19 1 23 8 23 8C23 8 19 15 12 15C5 15 1 8 1 8Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="8" r="3" stroke="black" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight">INICIAR SESION</h1>
          <p className="text-sm text-gray-400 mt-2">Accede a tu cuenta mayorista</p>
        </div>

        <div className="border border-gray-100 p-8">
          {/* Demo credentials */}
          <div className="bg-[#f8f8f8] p-4 mb-6">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1">Cuenta Demo</p>
            <p className="text-[12px] text-gray-500">Email: demo@central-eyewear.com</p>
            <p className="text-[12px] text-gray-500">Contrasena: demo123</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 mb-4 text-[12px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black w-3.5 h-3.5" />
                <span className="text-gray-500">Recordarme</span>
              </label>
              <a href="#" className="text-gray-500 underline underline-offset-2 hover:text-black">Olvidaste tu contrasena?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3.5 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">INGRESANDO...</span>
              ) : (
                <><LogIn size={16} /> INGRESAR</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[12px] text-gray-400">
              No tenes cuenta?{' '}
              <Link to="/registro" className="text-black font-semibold underline underline-offset-2">
                Registrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
