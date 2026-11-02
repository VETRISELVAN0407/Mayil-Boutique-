import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const mask = (...gradients) => ({
  mixBlendMode: 'multiply',
  WebkitMaskImage: gradients.join(', '),
  WebkitMaskComposite: 'source-in',
  maskImage: gradients.join(', '),
  maskComposite: 'intersect',
});
const FEATHER_MASK_TOP = mask('linear-gradient(to left, #000 55%, transparent)', 'linear-gradient(to bottom, #000 65%, transparent)');
// the second feather is rotated 180deg, so its fades point the other way round
const FEATHER_MASK_BOTTOM = mask('linear-gradient(to left, #000 55%, transparent)', 'linear-gradient(to bottom, #000 65%, transparent)');

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/admin/products', label: 'Products', icon: ProductsIcon },
  { to: '/admin/categories', label: 'Categories', icon: CategoryIcon },
  { to: '/admin/orders', label: 'Orders', icon: OrdersIcon },
  { to: '/admin/stock-update', label: 'Stock Update', icon: StockUpdateIcon },
  { to: '/admin/customers', label: 'Customers', icon: CustomersIcon },
  { to: '/admin/coupons', label: 'Coupons', icon: CouponsIcon },
  { to: '/admin/sales', label: 'Discounts & Sales', icon: SalesIcon },
  { to: '/admin/try-on', label: 'Virtual Try-On', icon: TryOnIcon },
];

export default function AdminLayout() {
  const { admin, status, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="flex items-center gap-3 text-peacock-deep">
          <SpinnerIcon />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-theme flex min-h-screen bg-[#fbf6ea]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          print:hidden fixed top-0 left-0 h-full z-40 w-64 flex flex-col bg-[#0f3d2e] text-white
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:sticky md:top-0 md:h-screen md:flex-shrink-0 md:translate-x-0 md:z-auto
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <Link to="/admin/dashboard" onClick={() => setSidebarOpen(false)}>
            <img src="/logo-mayil.png" alt="Mayil Boutique" className="h-[52px] w-auto" />
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#E3BF72]">Admin Portal</p>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/60 hover:text-white p-1"
            aria-label="Close menu"
          >
            <XIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-white/10 text-[#E3BF72] font-semibold border-l-2 border-[#E3BF72] pl-[10px]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          {admin && (
            <div className="flex items-center gap-2 px-1 pb-2">
              <div className="w-7 h-7 rounded-full bg-[#E3BF72]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#E3BF72] text-xs font-bold">
                  {(admin.mobile || 'A')[0]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white font-medium truncate">Administrator</p>
                <p className="text-[10px] text-white/40 truncate">{admin.mobile}</p>
              </div>
            </div>
          )}
          <NavLink
            to="/admin/account"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                isActive ? 'bg-white/10 text-[#E3BF72] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <KeyIcon size={15} />
            Account
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
          >
            <LogoutIcon size={15} />
            Sign Out
          </button>
          <Link
            to="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ExternalIcon size={12} />
            View Storefront
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="relative flex-1 flex flex-col min-w-0">
        {/* peacock feathers fixed behind the content (cropped art, faded at the edges) */}
        <div aria-hidden="true" className="print:hidden pointer-events-none fixed inset-0 overflow-hidden md:left-64">
          <img
            src="/pdp-feather.jpg"
            alt=""
            className="absolute right-0 top-0 w-[300px] opacity-80 md:w-[380px]"
            style={FEATHER_MASK_TOP}
          />
          <img
            src="/pdp-feather.jpg"
            alt=""
            className="absolute bottom-0 left-0 hidden w-[300px] -scale-100 opacity-50 lg:block"
            style={FEATHER_MASK_BOTTOM}
          />
        </div>

        {/* Mobile top bar */}
        <header className="print:hidden sticky top-0 z-20 bg-[#0f3d2e] flex items-center gap-3 px-4 h-14 md:hidden shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/80 hover:text-white p-1"
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <span className="font-serif text-base text-white">Mayil Boutique</span>
          <span className="text-xs text-[#E3BF72] ml-1">Admin</span>
        </header>

        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ─── Icon components ─── */
function DashboardIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ProductsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function CategoryIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}
function OrdersIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function CustomersIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function CouponsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function SalesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function TryOnIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  );
}
function LogoutIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function KeyIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="15" r="4" /><path d="M10.85 12.15 19 4" /><path d="m18 5 3 3" /><path d="m15 8 3 3" />
    </svg>
  );
}
function ExternalIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function StockUpdateIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" /><path d="M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
