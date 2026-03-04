import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye } from 'lucide-react';

export default function ProductCard({ product }) {
  const discount = Math.round((1 - product.wholesalePrice / product.retailPrice) * 100);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-60 group-hover:scale-110 transition-transform duration-500">
          {product.categoryId === 1 ? '🕶️' : product.categoryId === 3 ? '🥽' : '👓'}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.newArrival && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold">NUEVO</span>
          )}
          {product.bestSeller && (
            <span className="bg-accent text-white text-xs px-2 py-1 rounded font-semibold">TOP VENTA</span>
          )}
          {product.polarized && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">POLARIZADO</span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <span className="bg-gold text-white text-xs px-2 py-1 rounded font-bold">-{discount}%</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link
            to={`/producto/${product.id}`}
            className="bg-white text-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-accent hover:text-white transition-colors"
          >
            <Eye size={16} /> Ver Detalle
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-accent font-semibold uppercase tracking-wide mb-1">{product.brand.name}</p>
        <Link to={`/producto/${product.id}`}>
          <h3 className="font-semibold text-gray-800 hover:text-accent transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>

        {/* Colors */}
        <div className="flex gap-1 mt-2">
          {product.colors.slice(0, 5).map((color) => (
            <span
              key={color.name}
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <Star size={14} className="fill-gold text-gold" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 line-through">${product.retailPrice.toLocaleString()}</p>
            <p className="text-xl font-bold text-primary">${product.wholesalePrice.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Min. {product.minOrder} unidades</p>
          </div>
          <Link
            to={`/producto/${product.id}`}
            className="p-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            title="Ver producto"
          >
            <ShoppingCart size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
