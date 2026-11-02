import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GOLD = '#E3BF72';

const FEATURES = [
  { label: 'Products & Inventory', icon: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></> },
  { label: 'Orders & Sales', icon: <><path d="M3 4h2l2.5 11h11L21 7H6" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></> },
  { label: 'Campaigns & Discounts', icon: <><path d="M3 12 12 3h9v9l-9 9z" /><path d="M16.5 7.5h.01" /></> },
];

/* The scanned art is cropped from a slightly different background, so its edges are faded into the page. */
const fade = (...gradients) => ({
  WebkitMaskImage: gradients.join(', '),
  WebkitMaskComposite: 'source-in',
  maskImage: gradients.join(', '),
  maskComposite: 'intersect',
});

export default function AdminLogin() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [status, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!mobile.trim() || !password) {
      setError('Mobile number and password are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(mobile.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fbf6ea]">
      {/* Left brand panel — hidden on small screens */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:px-16 xl:py-12"
        style={{ background: 'radial-gradient(ellipse at 70% 12%, #0a6a56 0%, #05463a 45%, #032e26 100%)' }}
      >
        {/* decorative rings and feather */}
        <div className="pointer-events-none absolute -right-28 -top-36 h-[300px] w-[300px] rounded-full border border-[#E3BF72]/50" />
        <div className="pointer-events-none absolute -left-24 top-[48%] h-[160px] w-[160px] rounded-full border border-[#E3BF72]/40" />
        <img
          src="/admin-feather.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-[260px] max-w-[50%]"
          style={{ mixBlendMode: 'lighten', ...fade('linear-gradient(to right, transparent, #000 40%)', 'linear-gradient(to bottom, transparent, #000 35%)') }}
        />

        <div className="relative">
          <img src="/logo-admin.png" alt="Mayil Boutique" className="h-[68px] w-auto" />
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.3em]" style={{ color: GOLD }}>Administrator Portal</p>
          <span className="mt-3 block h-0.5 w-10" style={{ backgroundColor: GOLD }} />
          <h1 className="mt-6 font-serif font-normal leading-[1.1] text-white" style={{ fontSize: 'clamp(1.75rem, 1.2rem + 1.5vw, 2.5rem)' }}>
            Manage your<br />boutique beautifully.
          </h1>
          <p className="mt-4 max-w-sm text-base font-light text-white/80">
            Your collections, orders, and customers — all in one place.
          </p>

          <ul className="mt-7 max-w-xs">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 border-b border-white/15 py-3 first:pt-0 last:border-b-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                  {f.icon}
                </svg>
                <span className="text-[15px]">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-8 text-xs text-white/70">
          © {new Date().getFullYear()} Mayil Boutique · Secure admin access
        </p>
      </div>

      {/* Right login form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <img
          src="/admin-sprig-top.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden w-[170px] sm:block"
          style={{ mixBlendMode: 'multiply', ...fade('linear-gradient(to left, #000 50%, transparent)', 'linear-gradient(to bottom, #000 55%, transparent)') }}
        />
        <img
          src="/admin-sprig-bottom.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 hidden w-[170px] sm:block"
          style={{ mixBlendMode: 'multiply', ...fade('linear-gradient(to left, #000 50%, transparent)', 'linear-gradient(to top, #000 55%, transparent)') }}
        />

        <div className="relative w-full max-w-[440px]">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <img src="/logo-mayil.png" alt="Mayil Boutique" className="mx-auto h-[64px] w-auto rounded bg-[#0f3d2e] px-3 py-1" />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em] text-[#8a6d2f]">Administrator Portal</p>
          </div>

          <div className="rounded-lg bg-[#fdf9ef] p-6 shadow-[0_10px_40px_rgba(7,63,70,0.10)] sm:p-9">
            <span className="block h-0.5 w-10 bg-[#E3BF72]" />
            <h2 className="mt-4 font-serif font-medium text-[#0f3d2e]" style={{ fontSize: 'clamp(1.625rem, 1.3rem + 1vw, 2.125rem)' }}>
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-[#6b6f6a] sm:text-base">Sign in to your administrator account.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="admin-mobile" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f3d2e]">
                  Mobile Number
                </label>
                <input
                  id="admin-mobile"
                  name="mobile"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter registered mobile number"
                  className="input-cream h-12 bg-[#fffdf8]"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f3d2e]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-cream h-12 bg-[#fffdf8] pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0f3d2e]/70 transition-colors hover:text-[#0f3d2e]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0b4a3a] font-serif text-lg text-white transition-colors hover:bg-[#083a2e] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <SpinnerIcon />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[#E3BF72]/50" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b08d47" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
                <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3z" /><path d="m8.5 12 2.5 2.5 4.5-5" />
              </svg>
              <span className="h-px flex-1 bg-[#E3BF72]/50" />
            </div>
            <p className="mt-2 text-center text-xs text-[#5d625d]">
              Secure access for authorised administrators only.
            </p>
            <p className="mt-1.5 text-center text-xs text-[#8a8d86]">
              Customer? <a href="/" className="text-[#0f5a3f] hover:underline">Go to the storefront</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
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
