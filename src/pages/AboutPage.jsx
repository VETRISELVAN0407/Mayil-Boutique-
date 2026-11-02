import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';

export default function AboutPage() {
  return (
    <PageShell crumb="About Us" title="The Soul of Mayil" subtitle="Our story">
      <div className="max-w-4xl space-y-6 leading-relaxed text-[#4a4a3f]">
        <p className="text-lg font-medium text-[#10241d]">
          Mayil Boutique was born from a love of Indian artisanship and the belief that fashion can be
          both beautiful and responsible.
        </p>

        <p>
          The name <strong className="text-[#10241d]">Mayil</strong> (மயில் — peacock in Tamil) is more than our identity —
          it is our promise. Like the peacock, every piece we craft is a celebration of colour, grace, and
          the rich tapestry of Indian culture.
        </p>

        <p>
          We work directly with artisan communities across India — block printers in Jaipur, chikan
          embroiderers in Lucknow, handloom weavers in Kanchipuram — to bring you fashion that honours
          centuries of craft while feeling entirely modern.
        </p>

        <h2 className="type-section pt-4 font-serif text-[#0f3d2e]">Our Values</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { icon: '✦', title: 'Handcrafted', desc: 'Every piece is made by skilled artisans using traditional techniques.' },
            { icon: '♻', title: 'Sustainable', desc: 'We use natural, eco-certified fabrics and minimal-waste production.' },
            { icon: '❤', title: 'Fair Trade', desc: 'Artisans receive fair wages and work in safe, dignified conditions.' },
          ].map((v) => (
            <div key={v.title} className="card-cream p-5 text-center">
              <span className="text-3xl text-[#b08d47]">{v.icon}</span>
              <h3 className="mb-1 mt-2 font-serif text-lg text-[#0f3d2e]">{v.title}</h3>
              <p className="text-xs leading-relaxed text-[#4a4a3f]">{v.desc}</p>
            </div>
          ))}
        </div>

        <p>
          Each Mayil Boutique collection is designed in Chennai and crafted in small batches — which means
          every piece you own is rare, intentional, and made to last.
        </p>

        <div className="pt-4 text-center">
          <Link to="/products" className="btn-green">Explore the Collection</Link>
        </div>
      </div>
    </PageShell>
  );
}
