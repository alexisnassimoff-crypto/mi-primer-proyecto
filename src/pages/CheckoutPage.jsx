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
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-4">PEDIDO CONFIRMADO</h1>
        <p className="text-sm text-gray-500 mb-2">Tu pedido ha sido recibido exitosamente.</p>
        <p className="text-sm text-gray-500 mb-8">Numero de pedido: <strong>#{Math.floor(Math.random() * 90000 + 10000)}</strong></p>
        <div className="bg-[#f8f8f8] p-6 mb-8 text-left">
          <h3 className="text-[11px] tracking-[0.1em] font-bold uppercase mb-4">Proximos pasos</h3>
          <ul className="space-y-2 text-[13px] text-gray-600">
            <li className="flex items-start gap-2"><Check size={14} className="shrink-0 mt-0.5" /> Recibiras un email con la confirmacion</li>
            <li className="flex items-start gap-2"><Check size={14} className="shrink-0 mt-0.5" /> Procesaremos tu pedido en las proximas 24hs</li>
            <li className="flex items-start gap-2"><Check size={14} className="shrink-0 mt-0.5" /> Te enviaremos los datos de pago por email</li>
            <li className="flex items-start gap-2"><Check size={14} className="shrink-0 mt-0.5" /> Una vez confirmado, despacharemos tu pedido</li>
          </ul>
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/productos" className="bg-black text-white px-10 py-3.5 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors">
            SEGUIR COMPRANDO
          </Link>
          <Link to="/" className="border border-black px-10 py-3.5 text-[12px] tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors">
            IR AL INICIO
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <Link to="/carrito" className="inline-flex items-center gap-2 text-[12px] tracking-[0.1em] underline underline-offset-4 hover:opacity-60 mb-8">
        <ArrowLeft size={12} /> VOLVER AL CARRITO
      </Link>

      <h1 className="text-3xl font-black tracking-tight mb-10">CHECKOUT</h1>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[
          { n: 1, label: 'Envio', icon: <Truck size={16} /> },
          { n: 2, label: 'Pago', icon: <CreditCard size={16} /> },
          { n: 3, label: 'Confirmar', icon: <Check size={16} /> },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-9 h-9 flex items-center justify-center text-[12px] font-medium ${
              step >= s.n ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s.n ? <Check size={14} /> : s.icon}
            </div>
            <span className={`text-[12px] tracking-wide font-medium hidden sm:inline ${step >= s.n ? 'text-black' : 'text-gray-400'}`}>{s.label}</span>
            {i < 2 && <div className={`w-10 h-px ${step > s.n ? 'bg-black' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="border border-gray-100 p-6 md:p-8">
              <h2 className="text-sm font-bold tracking-[0.1em] uppercase mb-6 flex items-center gap-2"><Truck size={16} /> Datos de Envio</h2>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Nombre / Contacto</label>
                    <input name="name" value={shippingData.name} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Empresa</label>
                    <input name="company" value={shippingData.company} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Direccion</label>
                  <input name="address" value={shippingData.address} onChange={handleShippingChange}
                    className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Ciudad</label>
                    <input name="city" value={shippingData.city} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Provincia</label>
                    <input name="province" value={shippingData.province} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Codigo Postal</label>
                    <input name="zip" value={shippingData.zip} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Telefono</label>
                  <input name="phone" value={shippingData.phone} onChange={handleShippingChange}
                    className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Notas (opcional)</label>
                  <textarea name="notes" value={shippingData.notes} onChange={handleShippingChange} rows={3}
                    className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors resize-none" placeholder="Instrucciones especiales..." />
                </div>
              </div>
              <button onClick={() => setStep(2)} className="mt-6 w-full bg-black text-white py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors">
                CONTINUAR AL PAGO
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="border border-gray-100 p-6 md:p-8">
              <h2 className="text-sm font-bold tracking-[0.1em] uppercase mb-6 flex items-center gap-2"><CreditCard size={16} /> Metodo de Pago</h2>
              <div className="space-y-3">
                {[
                  { id: 'transfer', label: 'Transferencia Bancaria', desc: 'Realiza una transferencia a nuestra cuenta', icon: <Building2 size={18} /> },
                  { id: 'mercadopago', label: 'Mercado Pago', desc: 'Paga con tarjeta, efectivo o saldo de MP', icon: <Wallet size={18} /> },
                  { id: 'cash', label: 'Efectivo / Contra Entrega', desc: 'Paga al recibir tu pedido (solo CABA)', icon: <Banknote size={18} /> },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 border-2 transition-colors text-left ${
                      paymentMethod === method.id ? 'border-black' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className={`shrink-0 ${paymentMethod === method.id ? 'text-black' : 'text-gray-400'}`}>{method.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{method.label}</p>
                      <p className="text-[12px] text-gray-400">{method.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      paymentMethod === method.id ? 'border-black bg-black' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {paymentMethod === method.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'transfer' && (
                <div className="mt-4 bg-[#f8f8f8] p-4 text-[13px]">
                  <p className="font-semibold mb-2">Datos bancarios:</p>
                  <p className="text-gray-500">Banco: Banco Nacion Argentina</p>
                  <p className="text-gray-500">Titular: CENTRAL-Eyewear SRL</p>
                  <p className="text-gray-500">CBU: 0110000000000000000000</p>
                  <p className="text-gray-500">Alias: CENTRAL-EYEWEAR</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-4 text-[12px] tracking-[0.15em] font-medium hover:bg-gray-50 transition-colors">
                  VOLVER
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-black text-white py-4 text-[12px] tracking-[0.15em] font-medium hover:bg-gray-800 transition-colors">
                  REVISAR PEDIDO
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="border border-gray-100 p-6 md:p-8">
              <h2 className="text-sm font-bold tracking-[0.1em] uppercase mb-6 flex items-center gap-2"><Check size={16} /> Confirmar Pedido</h2>

              <div className="space-y-4">
                <div className="bg-[#f8f8f8] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[11px] tracking-[0.1em] font-bold uppercase">Envio</h3>
                    <button onClick={() => setStep(1)} className="text-[11px] underline underline-offset-2 text-gray-400 hover:text-black">Editar</button>
                  </div>
                  <p className="text-[13px] text-gray-500">{shippingData.name} - {shippingData.company}</p>
                  <p className="text-[13px] text-gray-500">{shippingData.address}, {shippingData.city}, {shippingData.province}</p>
                  <p className="text-[13px] text-gray-500">Tel: {shippingData.phone}</p>
                </div>

                <div className="bg-[#f8f8f8] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[11px] tracking-[0.1em] font-bold uppercase">Pago</h3>
                    <button onClick={() => setStep(2)} className="text-[11px] underline underline-offset-2 text-gray-400 hover:text-black">Editar</button>
                  </div>
                  <p className="text-[13px] text-gray-500">
                    {paymentMethod === 'transfer' ? 'Transferencia Bancaria' : paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Efectivo / Contra Entrega'}
                  </p>
                </div>

                <div>
                  <h3 className="text-[11px] tracking-[0.1em] font-bold uppercase mb-3">Productos ({items.length} items)</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={`${item.id}-${item.color}`} className="flex justify-between items-center py-2 border-b border-gray-100 text-[13px]">
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
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 py-4 text-[12px] tracking-[0.15em] font-medium hover:bg-gray-50 transition-colors">
                  VOLVER
                </button>
                <button onClick={handleSubmitOrder} className="flex-1 bg-black text-white py-4 text-[12px] tracking-[0.15em] font-medium hover:bg-gray-800 transition-colors">
                  CONFIRMAR PEDIDO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 p-6 sticky top-36">
            <h3 className="text-sm font-bold tracking-[0.1em] uppercase mb-5">Resumen</h3>
            <div className="space-y-2 text-[13px] max-h-48 overflow-y-auto mb-4">
              {items.map(item => (
                <div key={`${item.id}-${item.color}`} className="flex justify-between">
                  <span className="text-gray-400 truncate mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium shrink-0">${(getItemPrice(item) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-400">Subtotal</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-400">Envio</span>
                <span>
                  {shipping === 0 ? 'GRATIS' : `$${shipping.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>${finalTotal.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-400">IVA no incluido</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
