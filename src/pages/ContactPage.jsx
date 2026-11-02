import { useState } from 'react';
import PageShell from '../components/ui/PageShell';
import { useToast } from '../context/ToastContext';
import { STORE_INFO } from '../config/store';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const toast = useToast();

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
    toast.success('Message received! We\'ll get back to you soon.');
  }

  return (
    <PageShell crumb="Contact Us" title="Contact Us" subtitle="We would love to hear from you">
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-10">
        {/* on phones the form comes first, so nobody has to scroll past the details to reach it */}
        <div className="order-2 md:order-1">
          <h2 className="font-serif text-xl text-[#0f3d2e] sm:text-2xl mb-4">Get in Touch</h2>
          <p className="text-sm text-brand-secondary leading-relaxed mb-6">
            We're here to help with sizing questions, order updates, and everything in between.
            We typically respond within 24 hours on working days.
          </p>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-[#b08d47] text-lg">✉</span>
              <div>
                <p className="font-semibold text-brand-primary">Email</p>
                <p className="text-brand-secondary">{STORE_INFO.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#b08d47] text-lg">☎</span>
              <div>
                <p className="font-semibold text-brand-primary">Phone</p>
                <p className="text-brand-secondary">{STORE_INFO.phone}</p>
                <p className="text-xs text-brand-secondary">Mon–Sat, 10 AM – 6 PM IST</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#b08d47] text-lg">⌖</span>
              <div>
                <p className="font-semibold text-brand-primary">Store Address</p>
                <p className="text-brand-secondary">{STORE_INFO.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-cream order-1 p-5 sm:p-6 md:order-2">
          {sent ? (
            <div className="text-center py-8">
              <span className="text-4xl">✓</span>
              <h3 className="font-serif text-xl text-[#0f3d2e] mt-3 mb-2">Message Sent!</h3>
              <p className="text-sm text-brand-secondary">We'll reply to you within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }} className="btn-ghost text-[#0f5a3f] mt-4">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f] mb-1.5">Name</label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="input-cream" required placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f] mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="input-cream" required placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f] mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setField('message', e.target.value)}
                  rows={5}
                  className="input-cream resize-none"
                  required
                  placeholder="How can we help you?"
                />
              </div>
              <button type="submit" className="btn-green w-full">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
