import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, Check, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      setSent(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 4000);
    }, 500);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">CONTACTO</h1>
          <p className="text-base text-gray-400 font-light">Estamos para ayudarte. Contactanos por cualquier consulta.</p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-16">
          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Informacion de Contacto</h2>
              <p className="text-sm text-gray-400">Nuestro equipo esta disponible de lunes a viernes.</p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <MapPin size={18} strokeWidth={1.5} />, title: 'Direccion', lines: ['Av. Corrientes 5678, Piso 3', 'C1043 - CABA, Argentina'] },
                { icon: <Phone size={18} strokeWidth={1.5} />, title: 'Telefono', lines: ['+54 11 4567-8900', '+54 11 4567-8901'] },
                { icon: <Mail size={18} strokeWidth={1.5} />, title: 'Email', lines: ['ventas@central-eyewear.com', 'info@central-eyewear.com'] },
                { icon: <Clock size={18} strokeWidth={1.5} />, title: 'Horario', lines: ['Lunes a Viernes: 9:00 - 18:00', 'Sabados: 9:00 - 13:00'] },
              ].map(item => (
                <div key={item.title} className="flex gap-4 p-4 bg-[#f8f8f8]">
                  <div className="text-gray-400 shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.lines.map((line, i) => (
                      <p key={i} className="text-[13px] text-gray-500">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-black text-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} />
                <p className="text-sm font-semibold">WhatsApp</p>
              </div>
              <p className="text-[12px] text-gray-400 mb-3">Escribinos por WhatsApp para una respuesta rapida</p>
              <a href="#" className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-[11px] tracking-[0.1em] font-medium hover:bg-gray-200 transition-colors">
                <MessageCircle size={14} /> ABRIR WHATSAPP
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="border border-gray-100 p-8 md:p-10">
              <h2 className="text-xl font-bold tracking-tight mb-8">Envianos un mensaje</h2>

              {sent && (
                <div className="bg-black text-white p-4 mb-6 flex items-center gap-2 text-sm">
                  <Check size={18} /> Mensaje enviado con exito. Te responderemos a la brevedad.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Nombre *</label>
                    <input name="name" value={formData.name} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Email *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Telefono</label>
                    <input name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" placeholder="+54 11 1234-5678" />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Asunto *</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors">
                      <option value="">Seleccionar...</option>
                      <option value="info">Consulta General</option>
                      <option value="pricing">Precios y Disponibilidad</option>
                      <option value="wholesale">Cuenta Mayorista</option>
                      <option value="order">Estado de Pedido</option>
                      <option value="returns">Devoluciones</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.1em] font-semibold uppercase mb-2">Mensaje *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows={5}
                    className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                    placeholder="Tu consulta..." />
                </div>
                <button type="submit"
                  className="bg-black text-white px-10 py-4 text-[12px] tracking-[0.2em] font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <Send size={14} /> ENVIAR MENSAJE
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-16 bg-[#f5f5f5] h-80 flex items-center justify-center">
          <div className="text-center">
            <MapPin size={32} className="mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-400 font-medium">Av. Corrientes 5678, CABA</p>
            <p className="text-[12px] text-gray-300">Mapa interactivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
