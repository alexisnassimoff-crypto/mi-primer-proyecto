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
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contacto</h1>
          <p className="text-xl text-gray-300">Estamos para ayudarte. Contactanos por cualquier consulta.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">Información de Contacto</h2>
            <p className="text-gray-500">Nuestro equipo de ventas está disponible de lunes a viernes para asistirte.</p>

            <div className="space-y-4">
              {[
                { icon: <MapPin size={22} />, title: 'Dirección', lines: ['Av. Corrientes 5678, Piso 3', 'C1043 - CABA, Argentina'] },
                { icon: <Phone size={22} />, title: 'Teléfono', lines: ['+54 11 4567-8900', '+54 11 4567-8901'] },
                { icon: <Mail size={22} />, title: 'Email', lines: ['ventas@central-eyewear.com', 'info@central-eyewear.com'] },
                { icon: <Clock size={22} />, title: 'Horario', lines: ['Lunes a Viernes: 9:00 - 18:00', 'Sábados: 9:00 - 13:00'] },
              ].map(item => (
                <div key={item.title} className="flex gap-4 p-4 bg-surface rounded-xl">
                  <div className="text-accent shrink-0 mt-1">{item.icon}</div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.lines.map((line, i) => (
                      <p key={i} className="text-sm text-gray-500">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-accent/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={20} className="text-accent" />
                <p className="font-semibold text-accent">WhatsApp</p>
              </div>
              <p className="text-sm text-gray-600 mb-3">Escribinos por WhatsApp para una respuesta rápida</p>
              <a href="#" className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm">
                <MessageCircle size={18} /> Abrir WhatsApp
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primary mb-6">Envianos un mensaje</h2>

              {sent && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6 flex items-center gap-2">
                  <Check size={20} /> ¡Mensaje enviado con éxito! Te responderemos a la brevedad.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input name="name" value={formData.name} onChange={handleChange} required
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent" placeholder="+54 11 1234-5678" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} required
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows={5}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-accent resize-none"
                    placeholder="Escribí tu consulta acá..." />
                </div>
                <button type="submit"
                  className="bg-accent text-white px-8 py-4 rounded-lg font-semibold hover:bg-accent-hover transition-colors flex items-center gap-2">
                  <Send size={18} /> Enviar Mensaje
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-80 flex items-center justify-center">
          <div className="text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">Av. Corrientes 5678, CABA</p>
            <p className="text-sm text-gray-400">Mapa interactivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
