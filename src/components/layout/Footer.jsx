import { Link } from 'react-router-dom';
import { STORE_INFO } from '../../config/store';
import { useCategories } from '../../hooks/useCatalog';

export default function Footer() {
  // Shop links come from the live categories, so removed or renamed ones never leave dead links behind.
  const categories = useCategories();
  const shopLinks = [
    { to: '/products', label: 'All Products' },
    ...categories.map((c) => ({ to: `/category/${c.slug}`, label: c.name })),
    { to: '/products?sort=newest', label: 'New Arrivals' },
  ];

  return (
    <footer className="bg-[#0f3d2e] text-white/80">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-xl font-semibold text-white mb-3">Mayil Boutique</h3>
            <p className="text-sm leading-relaxed text-white/60">
              Premium Indian ethnic fashion crafted with love and tradition. Every piece tells a story.
            </p>
            <p className="mt-4 text-xs text-white/40">{STORE_INFO.address}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-serif text-lg text-[#E3BF72] mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              {shopLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#E3BF72] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-lg text-[#E3BF72] mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/login', label: 'Sign In' },
                { to: '/account', label: 'My Account' },
                { to: '/account/orders', label: 'My Orders' },
                { to: '/wishlist', label: 'Wishlist' },
                { to: '/cart', label: 'Cart' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#E3BF72] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-serif text-lg text-[#E3BF72] mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/contact', label: 'Contact Us' },
                { to: '/about', label: 'About Us' },
                { to: '/policy/shipping', label: 'Shipping Policy' },
                { to: '/policy/returns', label: 'Returns & Exchanges' },
                { to: '/policy/privacy', label: 'Privacy Policy' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#E3BF72] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Mayil Boutique. All rights reserved.
        &nbsp;·&nbsp; This is a demo storefront — no real transactions are processed.
      </div>
    </footer>
  );
}
