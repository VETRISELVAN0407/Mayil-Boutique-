import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hooks/useCatalog';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTryOnAvailable } from '../../hooks/useTryOn';

const linkBase = 'font-serif text-[0.9375rem] tracking-wide lg:text-[1.0625rem] transition-colors';
const iconBtn = 'relative p-1.5 text-[#F4EBDA] sm:p-2 transition-colors hover:text-[#E3BF72]';
const menuItem = 'block px-4 py-2 text-sm text-[#F4EBDA] hover:bg-white/5';

const SHOP_LINKS = [
  { to: '/products', label: 'All Products' },
  { to: '/products?sort=newest', label: 'New Arrivals' },
];

function topLink({ isActive }) {
  return `${linkBase} relative py-1 ${
    isActive
      ? 'text-[#E3BF72] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-[#E3BF72]'
      : 'text-[#F4EBDA] hover:text-[#E3BF72]'
  }`;
}

function Dropdown({ label, links, open, onToggle, onNavigate }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${linkBase} flex items-center gap-1 py-1 ${open ? 'text-[#E3BF72]' : 'text-[#F4EBDA] hover:text-[#E3BF72]'}`}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
          <div className="max-h-80 w-56 overflow-y-auto rounded-md border border-white/10 bg-[#0f3d2e] py-2 shadow-card-hover">
            {links.length === 0 && <p className="px-4 py-2 text-sm text-white/50">Nothing here yet</p>}
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={onNavigate} className={menuItem}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Sits on top of the hero photo on the home page; a solid dark bar everywhere else. */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // 'shop' | 'collections' | null
  const navRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const { isLoggedIn, customer, logout } = useAuth();
  const categories = useCategories();
  const { cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const tryOnAvailable = useTryOnAvailable() === true;

  const collectionLinks = categories.map((c) => ({ to: `/category/${c.slug}`, label: c.name }));
  const mobileLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    ...collectionLinks,
    ...(tryOnAvailable ? [{ to: '/virtual-try-on', label: 'Virtual Try-On' }] : []),
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    if (!openMenu) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !navRef.current?.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [openMenu]);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  }

  const toggle = (id) => setOpenMenu((current) => (current === id ? null : id));

  return (
    <header className={isHome ? 'absolute inset-x-0 top-0 z-50' : 'sticky top-0 z-50 bg-[#0f3d2e] shadow-nav'}>
      <div className={`mx-auto flex h-[4.25rem] md:h-[5.75rem] ${isHome ? 'max-w-[77.25rem] lg:px-0' : 'max-w-[87.5rem] lg:px-4'} items-center justify-between gap-4 px-4 sm:px-6`}>
        {/* Logo */}
        <Link to="/" className="flex-shrink-0" aria-label="Mayil Boutique home">
          <img src="/logo-mayil.png" alt="Mayil Boutique" className="h-[2.75rem] w-auto min-[380px]:h-[3.25rem] md:h-[4rem] lg:h-[5rem]" />
        </Link>

        {/* Desktop Nav */}
        <nav ref={navRef} className="hidden items-center gap-4 md:flex lg:gap-10">
          <NavLink to="/" end className={topLink}>Home</NavLink>
          <Dropdown
            label="Shop"
            links={SHOP_LINKS}
            open={openMenu === 'shop'}
            onToggle={() => toggle('shop')}
            onNavigate={() => setOpenMenu(null)}
          />
          <Dropdown
            label="Collections"
            links={collectionLinks}
            open={openMenu === 'collections'}
            onToggle={() => toggle('collections')}
            onNavigate={() => setOpenMenu(null)}
          />
          {tryOnAvailable && <NavLink to="/virtual-try-on" className={topLink}>Virtual Try-On</NavLink>}
          <NavLink to="/about" className={topLink}>About Us</NavLink>
          <NavLink to="/contact" className={topLink}>Contact</NavLink>
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          <span className="mr-4 hidden h-12 w-px bg-[#E3BF72]/40 lg:block" />
          <button onClick={() => setSearchOpen((o) => !o)} className={iconBtn} aria-label="Search">
            <SearchIcon />
          </button>

          {/* Wishlist */}
          <Link to="/wishlist" className={iconBtn} aria-label="Wishlist">
            <HeartIcon />
            <span className="absolute right-0 top-0 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#E3BF72] px-1 text-[0.625rem] font-bold text-[#10241d]">
              {wishlistItems.length}
            </span>
          </Link>

          {/* Account: dropdown when signed in, plain Sign Up button otherwise */}
          {isLoggedIn ? (
            <div className="group relative hidden md:block">
              <Link to="/account" className={`${iconBtn} block`} aria-label="Account">
                <PersonIcon />
              </Link>
              <div className="absolute right-0 top-full hidden w-48 pt-2 group-hover:block">
                <div className="rounded-md border border-white/10 bg-[#0f3d2e] py-2 shadow-card-hover">
                  <p className="px-4 py-2 text-xs text-white/50">+91 {customer.mobile}</p>
                  <Link to="/account" className={menuItem}>My Account</Link>
                  <Link to="/account/orders" className={menuItem}>My Orders</Link>
                  <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-[#e58a8f] hover:bg-white/5">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 hidden rounded-full border border-[#E3BF72] px-4 lg:px-5 py-1.5 font-serif text-[0.9375rem] text-[#E3BF72] transition-colors hover:bg-[#E3BF72] hover:text-[#10241d] md:inline-flex"
            >
              Sign Up
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className={iconBtn} aria-label="Cart">
            <BagIcon />
            <span className="absolute right-0 top-0 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#E3BF72] px-1 text-[0.625rem] font-bold text-[#10241d]">
              {cartCount}
            </span>
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen((o) => !o)} className={`${iconBtn} md:hidden`} aria-label="Menu">
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-white/10 bg-[#0f3d2e] px-4 py-3">
          <form onSubmit={handleSearch} className="page-container flex gap-2">
            <input
              autoFocus
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search for sarees, kurtis, lehengas…"
              className="input-field flex-1"
            />
            <button type="submit" className="btn-gold px-5">Search</button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0f3d2e] md:hidden">
          <nav className="page-container flex flex-col gap-1 py-4">
            {mobileLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `py-2.5 font-serif text-base ${isActive ? 'text-[#E3BF72]' : 'text-[#F4EBDA]'}`}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-white/10 pt-3">
              {isLoggedIn ? (
                <>
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-[#F4EBDA]">
                    My Account
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="block py-2 text-sm text-[#e58a8f]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-[#E3BF72]">
                  Sign Up / Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M5 8h14l1 13H4L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
