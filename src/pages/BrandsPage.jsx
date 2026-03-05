import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { brands, products } from '../data/products';

export default function BrandsPage() {
  return (
    <div>
      <section className="bg-black text-white py-20">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">MARCAS</h1>
          <p className="text-base text-gray-400 font-light max-w-2xl mx-auto">
            Trabajamos con las marcas mas prestigiosas del mundo. Todos nuestros productos son 100% originales.
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map(brand => {
            const brandProducts = products.filter(p => p.brandId === brand.id);
            const minPrice = Math.min(...brandProducts.map(p => p.wholesalePrice));

            return (
              <Link
                key={brand.id}
                to={`/productos?marca=${brand.slug}`}
                className="group border border-gray-100 hover:border-black transition-colors overflow-hidden"
              >
                <div className="bg-[#f5f5f5] p-10 text-center">
                  <h2 className="text-2xl font-black tracking-tight group-hover:opacity-70 transition-opacity">{brand.name}</h2>
                </div>
                <div className="p-5">
                  <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">{brand.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[12px] text-gray-400">{brandProducts.length} productos</p>
                      <p className="text-sm font-semibold">Desde ${minPrice.toLocaleString()}</p>
                    </div>
                    <span className="text-[12px] tracking-[0.1em] font-medium flex items-center gap-1 group-hover:opacity-60 transition-opacity">
                      VER <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
