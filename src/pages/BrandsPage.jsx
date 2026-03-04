import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { brands, products } from '../data/products';

export default function BrandsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary">Nuestras Marcas</h1>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Trabajamos con las marcas más prestigiosas del mundo. Todos nuestros productos son 100% originales con garantía de autenticidad.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map(brand => {
          const brandProducts = products.filter(p => p.brandId === brand.id);
          const minPrice = Math.min(...brandProducts.map(p => p.wholesalePrice));
          const categoryCounts = {};
          brandProducts.forEach(p => {
            categoryCounts[p.category.name] = (categoryCounts[p.category.name] || 0) + 1;
          });

          return (
            <Link
              key={brand.id}
              to={`/productos?marca=${brand.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gold transition-all group overflow-hidden"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
                <span className="text-6xl block mb-3 group-hover:scale-110 transition-transform">{brand.logo}</span>
                <h2 className="text-2xl font-bold text-primary group-hover:text-gold transition-colors">{brand.name}</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-3">{brand.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {Object.entries(categoryCounts).slice(0, 3).map(([cat, count]) => (
                    <span key={cat} className="text-xs bg-surface px-2 py-1 rounded text-gray-500">{cat} ({count})</span>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-400">{brandProducts.length} productos</p>
                    <p className="text-sm font-semibold text-primary">Desde ${minPrice.toLocaleString()}</p>
                  </div>
                  <span className="text-accent font-medium text-sm flex items-center gap-1 group-hover:underline">
                    Ver <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
