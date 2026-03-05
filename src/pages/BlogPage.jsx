import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: 'Tendencias en Eyewear 2026: Lo que viene',
    excerpt: 'Descubri las tendencias que van a dominar el mercado de anteojos este ano. Desde formas oversized hasta materiales sustentables.',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=500&fit=crop',
    category: 'Tendencias',
    date: '28 Feb 2026',
  },
  {
    id: 2,
    title: 'Como elegir los anteojos perfectos para cada rostro',
    excerpt: 'Guia completa para asesorar a tus clientes sobre la forma de anteojo ideal segun su tipo de rostro.',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&h=500&fit=crop',
    category: 'Guias',
    date: '20 Feb 2026',
  },
  {
    id: 3,
    title: 'Proteccion UV: Todo lo que tus clientes necesitan saber',
    excerpt: 'La importancia de la proteccion UV en los anteojos de sol y como comunicarlo efectivamente.',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=500&fit=crop',
    category: 'Educacion',
    date: '15 Feb 2026',
  },
  {
    id: 4,
    title: 'Lentes polarizados: Ventajas y diferencias',
    excerpt: 'Conoce las ventajas reales de los lentes polarizados y cuando recomendarlos a tus clientes.',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=500&fit=crop',
    category: 'Productos',
    date: '10 Feb 2026',
  },
  {
    id: 5,
    title: 'Estrategias de visual merchandising para opticas',
    excerpt: 'Tips practicos para mejorar la exhibicion de productos y aumentar las ventas en tu optica.',
    image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&h=500&fit=crop',
    category: 'Negocio',
    date: '5 Feb 2026',
  },
  {
    id: 6,
    title: 'Nuevas colecciones primavera-verano 2026',
    excerpt: 'Preview exclusivo de las colecciones que llegan para la temporada de sol.',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&h=500&fit=crop',
    category: 'Colecciones',
    date: '1 Feb 2026',
  },
];

export default function BlogPage() {
  const featuredPost = blogPosts[0];
  const otherPosts = blogPosts.slice(1);

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">BLOG</h1>
          <p className="text-base text-gray-400 font-light">Tendencias, guias y novedades del mundo eyewear</p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24">
        {/* Featured post */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
            <img
              src={featuredPost.image}
              alt={featuredPost.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[11px] tracking-[0.2em] text-gray-400 uppercase">{featuredPost.category} · {featuredPost.date}</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-3 mb-4">{featuredPost.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{featuredPost.excerpt}</p>
            <div>
              <span className="inline-flex items-center gap-2 text-[12px] tracking-[0.15em] font-medium border-b border-black pb-1 hover:opacity-60 transition-opacity cursor-pointer">
                LEER MAS <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>

        {/* Grid of posts */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {otherPosts.map(post => (
            <article key={post.id} className="group cursor-pointer">
              <div className="aspect-[3/2] bg-[#f5f5f5] overflow-hidden mb-5">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">{post.category} · {post.date}</span>
              <h3 className="text-base font-bold tracking-tight mt-2 mb-2 group-hover:opacity-70 transition-opacity">{post.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
