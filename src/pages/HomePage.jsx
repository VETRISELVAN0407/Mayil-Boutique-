import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProducts } from '../hooks/useCatalog';
import ProductCard from '../components/ui/ProductCard';
import ProductImage from '../components/ui/ProductImage';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton';

const GOLD = '#E3BF72';
const MAX_HOME_CATEGORIES = 6;

const FEATURES = [
  { title: 'Free Shipping', desc: 'On orders above ₹999', icon: <path d="M2 6h12v10H2zM14 9h4l3 3v4h-7M6 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01" /> },
  { title: 'Secure Payments', desc: '100% safe & reliable', icon: <><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></> },
  { title: 'Easy Returns', desc: 'Hassle free returns', icon: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></> },
  { title: 'Premium Quality', desc: 'Crafted with care', icon: <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" /> },
];

function Ornament() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke={GOLD} strokeWidth="1" aria-hidden="true">
      <path d="M1 6h6M15 6h6M11 1l5 5-5 5-5-5z" />
    </svg>
  );
}

export default function HomePage() {
  const { products, categories, loading } = useProducts();
  const featured = products.slice(0, 8);
  const newArrivals = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4),
    [products]
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#0b2a1f] lg:h-[clamp(38rem,46vw,56rem)]">
        <img
          src="/hero-garden.jpg"
          alt="A woman in a green silk saree seated beside a peacock in a temple garden"
          fetchpriority="high"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_center]"
        />
        {/* dark green wash on the left keeps the headline readable and fades into the photo */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#082418]/90 via-[#082418]/65 to-[#082418]/10 lg:from-[#082418]/95 lg:via-[#082418]/55 lg:via-[45%] lg:to-transparent lg:to-[70%]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#082418]/70 to-transparent" />

        <div className="mx-auto flex min-h-[36rem] max-w-[77.25rem] flex-col justify-center px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:h-full lg:min-h-0 lg:px-0 lg:pb-16 lg:pt-28">
          <div className="flex items-center gap-4">
            <span className="hidden h-px w-12 bg-[#E3BF72]/80 sm:block" />
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.32em] sm:text-[0.8125rem]" style={{ color: GOLD }}>
              Tradition Meets Trend
            </p>
            <span className="hidden h-px w-12 bg-[#E3BF72]/80 sm:block" />
          </div>
          <h1 className="mt-6 max-w-[40rem] font-serif text-[2.5rem] font-normal leading-[1.08] text-[#f7f0e1] sm:text-[3.25rem] lg:text-[clamp(3rem,4.4vw,4.5rem)]">
            Timeless Elegance
            <br />
            in{' '}
            <span
              className="px-1 text-[1.25em] font-normal leading-none"
              style={{ color: GOLD, fontFamily: "'Great Vibes', cursive" }}
            >
              Every
            </span>{' '}
            Thread
          </h1>
          <p className="mt-6 max-w-[27rem] text-[1rem] leading-[1.7] text-white/90">
            Discover exquisite Indian fashion that celebrates your unique style. From traditional sarees to modern
            ethnic wear, find your perfect attire at Mayil Boutique.
          </p>
          <div className="mt-9">
            <Link
              to="/products"
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-b from-[#f3d68c] to-[#d9ad4f] px-9 py-3.5 text-[0.9375rem] font-semibold text-[#10241d] shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition hover:brightness-95"
            >
              Shop Now <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <a
          href="#after-hero"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[0.8125rem] tracking-[0.12em] text-white/70 transition-colors hover:text-white lg:left-[max(1rem,calc(50%-38.625rem+0.5rem))] lg:flex lg:translate-x-0"
        >
          <svg width="22" height="34" viewBox="0 0 22 34" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <rect x="1" y="1" width="20" height="32" rx="10" />
            <path d="M11 8v6" strokeLinecap="round" />
          </svg>
          Scroll Down
        </a>
      </section>
      <div id="after-hero" />

      {/* Features strip */}
      <section className="bg-[#f3ede2]">
        <div className="mx-auto grid max-w-[80rem] grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-10">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`flex items-center justify-center gap-4 px-4 ${i > 0 ? 'lg:border-l lg:border-brand-border' : ''}`}
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#8a6d2f" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
                {f.icon}
              </svg>
              <div>
                <p className="font-serif text-[0.9375rem] text-[#10241d]">{f.title}</p>
                <p className="mt-0.5 text-[0.6875rem] text-brand-secondary">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="bg-[#faf6ee] pb-8 pt-12">
        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-10">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-24 bg-[#E3BF72]/70" />
              <Ornament />
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#8a6d2f]">Shop by Category</p>
              <Ornament />
              <span className="h-px w-24 bg-[#E3BF72]/70" />
            </div>
            <h2 className="type-section mt-2 font-serif font-normal text-[#0f3d2e]">Explore Our Collections</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-10 sm:gap-x-12">
            {categories.slice(0, MAX_HOME_CATEGORIES).map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="group flex w-[8.75rem] flex-col items-center text-center sm:w-[11.25rem]"
              >
                <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-[#10241d] shadow-card ring-2 ring-[#E3BF72]/70 ring-offset-4 ring-offset-[#faf6ee] transition-shadow duration-300 group-hover:shadow-card-hover group-hover:ring-[#E3BF72]">
                  <ProductImage
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="type-product-name mt-5 font-serif text-[#0f3d2e] transition-colors group-hover:text-[#8a6d2f]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-ivory pb-16 pt-8">
        <div className="page-container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-subtitle">Just In</p>
              <h2 className="section-title">New Arrivals</h2>
              <div className="divider-gold" />
            </div>
            <Link to="/products?sort=newest" className="btn-ghost text-peacock-teal text-sm font-semibold hidden sm:inline-flex">
              View All →
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Story Banner */}
      <section className="relative py-20 bg-peacock-deep overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://marketplace.canva.com/EAFYElY5EE4/1/0/1600w/canva-brown-and-white-modern-fashion-banner-landscape-Ap8IU9nEbh8.jpg)',
          }}
        />
        <div className="relative page-container flex flex-col md:flex-row items-center gap-10 text-white">
          <div className="flex-1">
            <p className="section-subtitle text-white/50 mb-3">Our Story</p>
            <h2 className="type-section font-serif font-bold mb-4">
              Crafted with Intention,<br />Worn with Pride
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mb-6">
              Every Mayil Boutique piece is a collaboration between our designers and master artisans
              across India — from the block printers of Rajasthan to the chikan embroiderers of Lucknow.
            </p>
            <Link to="/about" className="btn-gold">
              Our Story
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4 text-center">
            {[
              { num: '500+', label: 'Artisan Partners' },
              { num: '20K+', label: 'Happy Customers' },
              { num: '100%', label: 'Handcrafted' },
            ].map((s) => (
              <div key={s.num} className="border border-white/20 py-6 px-2">
                <div className="font-serif text-2xl font-bold text-peacock-gold">{s.num}</div>
                <div className="text-xs text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-ivory py-16">
        <div className="page-container">
          <div className="text-center mb-10">
            <p className="section-subtitle">Handpicked for you</p>
            <h2 className="section-title">Featured Pieces</h2>
            <div className="divider-gold mx-auto" />
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/products" className="btn-outline">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-12 page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🚚', title: 'Cash on Delivery', desc: 'Pay when your order arrives' },
            { icon: '↩', title: 'Easy Returns', desc: '7-day hassle-free returns' },
            { icon: '🔒', title: 'Secure Login', desc: 'OTP-protected account' },
            { icon: '✦', title: 'Handcrafted', desc: 'Authentic Indian artisanship' },
          ].map((p) => (
            <div key={p.title} className="flex flex-col items-center gap-2 py-4">
              <span className="text-3xl">{p.icon}</span>
              <h4 className="font-serif text-sm font-semibold text-peacock-deep">{p.title}</h4>
              <p className="text-xs text-brand-secondary">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
