import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const mockUsers = [
  {
    id: 1,
    email: 'demo@centraleyewear.com',
    password: 'demo123',
    name: 'Óptica Demo',
    company: 'Óptica Central SRL',
    cuit: '30-71234567-8',
    phone: '+54 11 4567-8901',
    address: 'Av. Corrientes 1234, CABA',
    approved: true,
    discount: 10,
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: 'Email o contraseña incorrectos' };
  };

  const register = (data) => {
    const newUser = {
      id: mockUsers.length + 1,
      ...data,
      approved: false,
      discount: 0,
    };
    mockUsers.push({ ...newUser, password: data.password });
    const { password: _, ...userData } = newUser;
    setUser(userData);
    return { success: true, message: 'Cuenta creada. Pendiente de aprobación.' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
