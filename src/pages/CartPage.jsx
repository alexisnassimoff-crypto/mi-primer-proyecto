import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ArrowLeft, X as XIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, getItemPrice } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-8" strokeWidth={1} />
        <h2 className="text-2xl font-bold tracking-tight mb-3">Tu carrito esta vacio</h2>
        <p className="text-[13px] text-gray-400 mb-10">Explora nuestro catalogo y agrega productos</p>
        <Link to="/productos" className="inline-block bg-black text-white rounded-full px-12 py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors">
          IR AL CATALOGO
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-12 md:py-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-16">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          PEDIDO <span className="text-gray-300">N°{Math.floor(Math.random() * 900 + 100)}</span>
        </h1>
        <button onClick={() => {}} className="hover:opacity-50 transition-opacity">
          <XIcon size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-6 pb-4 border-b border-black text-[11px] tracking-[0.15em] font-medium text-gray-400 uppercase">
        <div>MODELO</div>
        <div className="text-center">COLOR</div>
        <div className="text-center">CANTIDAD</div>
        <div className="text-center">PRECIO</div>
        <div className="text-center">SUBTOTAL</div>
        <div className="w-16"></div>
      </div>

      {/* Items */}
      <div>
        {items.map(item => {
          const unitPrice = getItemPrice(item);
          const subtotal = unitPrice * item.quantity;
          return (
            <div key={`${item.id}-${item.color}`} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 md:gap-6 items-center py-8 md:py-10 border-b border-gray-100">
              {/* Product */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-14 bg-[#f5f5f5] shrink-0 overflow-hidden">
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[14px] font-medium">{item.name?.split(' ').slice(-2).join(' ') || 'SUN'}</p>
                </div>
              </div>

              {/* Color */}
              <div className="text-center text-[13px] text-gray-500">
                <span className="md:hidden text-gray-400 mr-2">Color:</span>
                {item.color?.charAt(0) || 'C1'}
              </div>

              {/* Quantity */}
              <div className="flex justify-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateQuantity(item.id, item.color, item.quantity - (item.minOrder || 1), item.minOrder || 1)}
                    className="text-gray-400 hover:text-black transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="text-[14px] font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.color, item.quantity + (item.minOrder || 1), item.minOrder || 1)}
                    className="text-gray-400 hover:text-black transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-center text-[14px]">
                <span className="md:hidden text-[12px] text-gray-400 mr-2">Precio:</span>
                ${unitPrice.toLocaleString()}
              </div>

              {/* Subtotal */}
              <div className="text-center text-[14px] font-medium">
                <span className="md:hidden text-[12px] text-gray-400 mr-2">Subtotal:</span>
                ${subtotal.toLocaleString()}
              </div>

              {/* Remove */}
              <div className="w-16 text-right">
                <button
                  onClick={() => removeItem(item.id, item.color)}
                  className="text-[12px] text-red-400 hover:text-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-8 gap-4">
        <button
          onClick={clearCart}
          className="text-[12px] text-red-400 hover:text-red-600 transition-colors"
        >
          Vaciar carrito
        </button>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-16">
          <p className="text-[12px] tracking-[0.15em] text-gray-400 uppercase">
            CANTIDAD TOTAL DE PRODUCTOS <span className="text-black font-bold ml-2 text-[14px]">{totalItems}</span>
          </p>
          <p className="text-[12px] tracking-[0.15em] text-gray-400 uppercase">
            TOTAL DEL PEDIDO <span className="text-black font-bold ml-2 text-[16px]">${totalPrice.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link
          to="/productos"
          className="block text-center border border-black py-5 text-[12px] tracking-[0.25em] font-medium hover:bg-black hover:text-white transition-all duration-300"
        >
          AGREGAR MAS PRODUCTOS
        </Link>
        {isAuthenticated ? (
          <Link
            to="/checkout"
            className="block text-center bg-black text-white py-5 text-[12px] tracking-[0.25em] font-medium hover:bg-gray-800 transition-colors"
          >
            FINALIZAR PEDIDO
          </Link>
        ) : (
          <Link
            to="/login"
            className="block text-center bg-black text-white py-5 text-[12px] tracking-[0.25em] font-medium hover:bg-gray-800 transition-colors"
          >
            INICIAR SESION PARA COMPRAR
          </Link>
        )}
      </div>
    </div>
  );
}
