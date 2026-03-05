import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, getItemPrice } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-6" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold tracking-tight mb-3">Tu carrito esta vacio</h2>
        <p className="text-sm text-gray-400 mb-8">Explora nuestro catalogo y agrega productos</p>
        <Link to="/productos" className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors">
          <ArrowLeft size={14} /> IR AL CATALOGO
        </Link>
      </div>
    );
  }

  const shipping = totalPrice >= 500000 ? 0 : 15000;
  const finalTotal = totalPrice + shipping;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-black tracking-tight">CARRITO</h1>
        <button onClick={clearCart} className="text-[12px] text-gray-400 underline underline-offset-2 hover:text-black transition-colors">
          Vaciar carrito
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Table header - desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[11px] tracking-[0.1em] font-semibold text-gray-400 uppercase border-b border-gray-100">
            <div className="col-span-5">Producto</div>
            <div className="col-span-2 text-center">Precio</div>
            <div className="col-span-2 text-center">Cantidad</div>
            <div className="col-span-2 text-center">Subtotal</div>
            <div className="col-span-1"></div>
          </div>

          {items.map(item => {
            const unitPrice = getItemPrice(item);
            const subtotal = unitPrice * item.quantity;
            return (
              <div key={`${item.id}-${item.color}`} className="border border-gray-100 p-4">
                <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  {/* Product info */}
                  <div className="md:col-span-5 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-[#f5f5f5] shrink-0 overflow-hidden">
                      <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[11px] tracking-[0.1em] text-gray-400 uppercase">{item.brand}</p>
                      <Link to={`/producto/${item.id}`} className="text-sm font-medium hover:opacity-60 line-clamp-1">{item.name}</Link>
                      <p className="text-[11px] text-gray-400">SKU: {item.sku} · {item.color}</p>
                    </div>
                  </div>

                  {/* Unit price */}
                  <div className="md:col-span-2 text-center mt-3 md:mt-0">
                    <span className="md:hidden text-[12px] text-gray-400 mr-2">Precio:</span>
                    <span className="text-sm font-medium">${unitPrice.toLocaleString()}</span>
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2 flex justify-center mt-3 md:mt-0">
                    <div className="flex items-center border">
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.quantity - item.minOrder, item.minOrder)}
                        className="px-2 py-1.5 hover:bg-gray-50"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, item.color, parseInt(e.target.value) || item.minOrder, item.minOrder)}
                        className="w-14 text-center py-1.5 text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.quantity + item.minOrder, item.minOrder)}
                        className="px-2 py-1.5 hover:bg-gray-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="md:col-span-2 text-center mt-3 md:mt-0">
                    <span className="md:hidden text-[12px] text-gray-400 mr-2">Subtotal:</span>
                    <span className="text-sm font-bold">${subtotal.toLocaleString()}</span>
                  </div>

                  {/* Remove */}
                  <div className="md:col-span-1 text-right mt-3 md:mt-0">
                    <button
                      onClick={() => removeItem(item.id, item.color)}
                      className="p-2 text-gray-300 hover:text-black transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/productos" className="inline-flex items-center gap-2 text-[12px] tracking-[0.1em] font-medium underline underline-offset-4 hover:opacity-60 mt-4">
            <ArrowLeft size={12} /> SEGUIR COMPRANDO
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 p-6 sticky top-36">
            <h3 className="text-sm font-bold tracking-[0.1em] uppercase mb-5">Resumen del Pedido</h3>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal ({totalItems} un.)</span>
                <span className="font-medium">${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Envio</span>
                <span className={`font-medium ${shipping === 0 ? '' : ''}`}>
                  {shipping === 0 ? 'GRATIS' : `$${shipping.toLocaleString()}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-[11px] text-gray-400 bg-[#f8f8f8] p-2">
                  Envio gratis en pedidos +$500.000. Faltan ${(500000 - totalPrice).toLocaleString()}
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-base">${finalTotal.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-400">IVA no incluido</p>
            </div>

            {/* Coupon */}
            <div className="mt-5">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Codigo de descuento"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 text-[12px] focus:outline-none focus:border-black"
                  />
                </div>
                <button className="px-4 py-2.5 border border-black text-[11px] tracking-[0.1em] font-medium hover:bg-black hover:text-white transition-colors">
                  APLICAR
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <Link
                to="/checkout"
                className="mt-6 w-full bg-black text-white py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                FINALIZAR COMPRA <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="mt-6 space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-black text-white py-4 text-[12px] tracking-[0.2em] font-medium text-center hover:bg-gray-800 transition-colors"
                >
                  INICIAR SESION
                </Link>
                <Link
                  to="/registro"
                  className="block w-full border border-black py-3 text-[12px] tracking-[0.2em] font-medium text-center hover:bg-black hover:text-white transition-colors"
                >
                  CREAR CUENTA
                </Link>
              </div>
            )}

            <div className="mt-4 text-center text-[11px] text-gray-400">
              Pago seguro · Garantia de autenticidad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
