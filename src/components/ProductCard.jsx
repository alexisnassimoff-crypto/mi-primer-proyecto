import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/producto/${product.id}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden mb-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />

        {/* Minimal badge */}
        {product.newArrival && (
          <div className="absolute top-3 left-3">
            <span className="bg-black text-white text-[10px] tracking-[0.15em] px-3 py-1 font-medium">
              NEW
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-[11px] tracking-[0.15em] text-gray-400 uppercase mb-1">
          {product.brand.name}
        </p>
        <h3 className="text-sm font-medium text-gray-900 group-hover:opacity-70 transition-opacity leading-tight">
          {product.name}
        </h3>

        {/* Colors */}
        <div className="flex gap-1.5 mt-2">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color.name}
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-gray-400 self-center">+{product.colors.length - 4}</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-sm font-semibold">${product.wholesalePrice.toLocaleString()}</p>
          <p className="text-xs text-gray-400 line-through">${product.retailPrice.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  );
}
