import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, Check, ArrowLeft, Building2, Wallet, Banknote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage() {
  const { items, totalPrice, getItemPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [orderComplete, setOrderComplete] = useState(false);

  const [shippingData, setShippingData] = useState({
    name: user?.name || '',
    company: user?.company || '',
    address: user?.address || '',
    city: '',
    province: '',
    zip: '',
    phone: user?.phone || '',
    notes: '',
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (items.length === 0 && !orderComplete) {
    navigate('/carrito');
    return null;
  }

  const shipping = totalPrice >= 500000 ? 0 : 15000;
  const finalTotal = totalPrice + shipping;

  const handleShippingChange = (e) => setShippingData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmitOrder = () => {
    setOrderComplete(true);
    clearCart();
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={48} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-primary mb-4">¡Pedido Confirmado!</h1>
        <p className="text-gray-500 mb-2">Tu pedido ha sido recibido exitosamente.</p>
        <p className="text-gray-500 mb-6">Número de pedido: <strong className="text-primary">#{Math.floor(Math.random() * 90000 + 10000)}</strong></p>
        <div className="bg-surface rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold mb-3">Próximos pasos:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><Check size={16} className="text-green-500 shrink-0 mt-0.5" /> Recibirás un email con la confirmación del pedido</li>
            <li className="flex items-start gap-2"><Check size={16} className="text-green-500 shrink-0 mt-0.5" /> Nuestro equipo procesará tu pedido en las próximas 24hs</li>
            <li className="flex items-start gap-2"><Check size={16} className="text-green-500 shrink-0 mt-0.5" /> Te enviaremos los datos de pago por email</li>
            <li className="flex items-start gap-2"><Check size={16} className="text-green-500 shrink-0 mt-0.5" /> Una vez confirmado el pago, despacharemos tu pedido</li>
          </ul>
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/productos" className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors">
            Seguir Comprando
          </Link>
          <Link to="/" className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors">
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/carrito" className="inline-flex items-center gap-2 text-accent font-medium hover:underline mb-6">
        <ArrowLeft size={16} /> Volver al carrito
      </Link>

      <h1 className="text-3xl font-bold text-primary mb-8">Finalizar Compra</h1>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[
          { n: 1, label: 'Envío', icon: <Truck size={20} /> },
          { n: 2, label: 'Pago', icon: <CreditCard size={20} /> },
          { n: 3, label: 'Confirmar', icon: <Check size={20} /> },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= s.n ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s.n ? <Check size={18} /> : s.icon}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${step >= s.n ? 'text-accent' : 'text-gray-400'}`}>{s.label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > s.n ? 'bg-accent' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Truck size={22} /> Datos de Envío</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Contacto</label>
                    <input name="name" value={shippingData.name} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <input name="company" value={shippingData.company} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input name="address" value={shippingData.address} onChange={handleShippingChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input name="city" value={shippingData.city} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <input name="province" value={shippingData.province} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input name="zip" value={shippingData.zip} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input name="phone" value={shippingData.phone} onChange={handleShippingChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas del pedido (opcional)</label>
                  <textarea name="notes" value={shippingData.notes} onChange={handleShippingChange} rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent resize-none" placeholder="Instrucciones especiales..." />
                </div>
              </div>
              <button onClick={() => setStep(2)} className="mt-6 w-full bg-accent text-white py-4 rounded-lg font-semibold hover:bg-accent-hover transition-colors">
                Continuar al Pago
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard size={22} /> Método de Pago</h2>
              <div className="space-y-3">
                {[
                  { id: 'transfer', label: 'Transferencia Bancaria', desc: 'Realizá una transferencia a nuestra cuenta', icon: <Building2 size={22} /> },
                  { id: 'mercadopago', label: 'Mercado Pago', desc: 'Pagá con tarjeta, efectivo o saldo de MP', icon: <Wallet size={22} /> },
                  { id: 'cash', label: 'Efectivo / Contra Entrega', desc: 'Pagá al recibir tu pedido (solo CABA)', icon: <Banknote size={22} /> },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${
                      paymentMethod === method.id ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`shrink-0 ${paymentMethod === method.id ? 'text-accent' : 'text-gray-400'}`}>{method.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                      paymentMethod === method.id ? 'border-accent bg-accent' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {paymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'transfer' && (
                <div className="mt-4 bg-surface p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Datos bancarios:</p>
                  <p>Banco: Banco Nación Argentina</p>
                  <p>Titular: CENTRAL-Eyewear SRL</p>
                  <p>CBU: 0110000000000000000000</p>
                  <p>Alias: CENTRAL-EYEWEAR</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-300 py-4 rounded-lg font-semibold hover:bg-surface transition-colors">
                  Volver
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-accent text-white py-4 rounded-lg font-semibold hover:bg-accent-hover transition-colors">
                  Revisar Pedido
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Check size={22} /> Confirmar Pedido</h2>

              <div className="space-y-4">
                <div className="bg-surface p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Envío</h3>
                    <button onClick={() => setStep(1)} className="text-sm text-accent hover:underline">Editar</button>
                  </div>
                  <p className="text-sm text-gray-600">{shippingData.name} - {shippingData.company}</p>
                  <p className="text-sm text-gray-600">{shippingData.address}, {shippingData.city}, {shippingData.province}</p>
                  <p className="text-sm text-gray-600">Tel: {shippingData.phone}</p>
                </div>

                <div className="bg-surface p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Pago</h3>
                    <button onClick={() => setStep(2)} className="text-sm text-accent hover:underline">Editar</button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {paymentMethod === 'transfer' ? 'Transferencia Bancaria' : paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Efectivo / Contra Entrega'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Productos ({items.length} ítems)</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={`${item.id}-${item.color}`} className="flex justify-between items-center py-2 border-b text-sm">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-gray-400">Color: {item.color} · Cant: {item.quantity}</p>
                        </div>
                        <p className="font-medium">${(getItemPrice(item) * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-300 py-4 rounded-lg font-semibold hover:bg-surface transition-colors">
                  Volver
                </button>
                <button onClick={handleSubmitOrder} className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors">
                  Confirmar Pedido
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-36">
            <h3 className="text-lg font-bold mb-4">Resumen</h3>
            <div className="space-y-2 text-sm max-h-48 overflow-y-auto mb-4">
              {items.map(item => (
                <div key={`${item.id}-${item.color}`} className="flex justify-between">
                  <span className="text-gray-500 truncate mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium shrink-0">${(getItemPrice(item) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Envío</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'GRATIS' : `$${shipping.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary">${finalTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400">IVA no incluido</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
