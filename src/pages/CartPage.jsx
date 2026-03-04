import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, getItemPrice } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
        <h2 className="text-3xl font-bold text-gray-600 mb-3">Tu carrito está vacío</h2>
        <p className="text-gray-400 mb-8">Explorá nuestro catálogo y agregá productos</p>
        <Link to="/productos" className="bg-accent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-hover transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={20} /> Ir al Catálogo
        </Link>
      </div>
    );
  }

  const shipping = totalPrice >= 500000 ? 0 : 15000;
  const finalTotal = totalPrice + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Carrito de Compras</h1>
        <button onClick={clearCart} className="text-sm text-gray-400 hover:text-accent transition-colors">
          Vaciar carrito
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Table header - desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-gray-500 border-b">
            <div className="col-span-5">Producto</div>
            <div className="col-span-2 text-center">Precio Unit.</div>
            <div className="col-span-2 text-center">Cantidad</div>
            <div className="col-span-2 text-center">Subtotal</div>
            <div className="col-span-1"></div>
          </div>

          {items.map(item => {
            const unitPrice = getItemPrice(item);
            const subtotal = unitPrice * item.quantity;
            return (
              <div key={`${item.id}-${item.color}`} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  {/* Product info */}
                  <div className="md:col-span-5 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-3xl shrink-0">
                      👓
                    </div>
                    <div>
                      <p className="text-xs text-accent font-semibold">{item.brand}</p>
                      <Link to={`/producto/${item.id}`} className="font-medium hover:text-accent line-clamp-1">{item.name}</Link>
                      <p className="text-xs text-gray-400">SKU: {item.sku} · Color: {item.color}</p>
                    </div>
                  </div>

                  {/* Unit price */}
                  <div className="md:col-span-2 text-center mt-3 md:mt-0">
                    <span className="md:hidden text-sm text-gray-500 mr-2">Precio:</span>
                    <span className="font-medium">${unitPrice.toLocaleString()}</span>
                    {unitPrice < item.wholesalePrice && (
                      <p className="text-xs text-green-600">Descuento por volumen</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2 flex justify-center mt-3 md:mt-0">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.quantity - item.minOrder, item.minOrder)}
                        className="px-2 py-1 hover:bg-surface"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, item.color, parseInt(e.target.value) || item.minOrder, item.minOrder)}
                        className="w-14 text-center py-1 text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.quantity + item.minOrder, item.minOrder)}
                        className="px-2 py-1 hover:bg-surface"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="md:col-span-2 text-center mt-3 md:mt-0">
                    <span className="md:hidden text-sm text-gray-500 mr-2">Subtotal:</span>
                    <span className="font-bold text-primary">${subtotal.toLocaleString()}</span>
                  </div>

                  {/* Remove */}
                  <div className="md:col-span-1 text-right mt-3 md:mt-0">
                    <button
                      onClick={() => removeItem(item.id, item.color)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/productos" className="inline-flex items-center gap-2 text-accent font-medium hover:underline mt-4">
            <ArrowLeft size={16} /> Seguir comprando
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-36">
            <h3 className="text-xl font-bold mb-4">Resumen del Pedido</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({totalItems} unidades)</span>
                <span className="font-medium">${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Envío</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'GRATIS' : `$${shipping.toLocaleString()}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400 bg-surface p-2 rounded">
                  Envío gratis en pedidos superiores a $500.000. Te faltan ${(500000 - totalPrice).toLocaleString()}
                </p>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">${finalTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400">IVA no incluido</p>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Código de descuento"
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <button className="px-4 py-2 border border-accent text-accent rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-colors">
                  Aplicar
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <Link
                to="/checkout"
                className="mt-6 w-full bg-accent text-white py-4 rounded-lg font-semibold text-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
              >
                Finalizar Compra <ArrowRight size={20} />
              </Link>
            ) : (
              <div className="mt-6 space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-accent text-white py-4 rounded-lg font-semibold text-center hover:bg-accent-hover transition-colors"
                >
                  Iniciar Sesión para Comprar
                </Link>
                <Link
                  to="/registro"
                  className="block w-full border-2 border-primary text-primary py-3 rounded-lg font-semibold text-center hover:bg-primary hover:text-white transition-colors"
                >
                  Crear Cuenta Mayorista
                </Link>
              </div>
            )}

            <div className="mt-4 text-center text-xs text-gray-400">
              Pago seguro · Garantía de autenticidad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
