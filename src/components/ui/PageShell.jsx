import { Link } from 'react-router-dom';

/* The art is cropped from a slightly different cream than the page, so every edge is faded out. */
const mask = (...gradients) => ({
  mixBlendMode: 'multiply',
  WebkitMaskImage: gradients.join(', '),
  WebkitMaskComposite: 'source-in',
  maskImage: gradients.join(', '),
  maskComposite: 'intersect',
});

/* Cream page with the floral edges, shared by the wishlist and cart pages. */
export default function PageShell({ crumb, title, subtitle, center = false, children }) {
  return (
    <div className="relative min-h-[70vh] flex-1 overflow-x-clip bg-[#fdf3e1]">
      <img
        src="/pdp-floral.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 hidden w-[8.75rem] opacity-70 xl:block"
        style={mask('linear-gradient(to right, #000 55%, transparent)', 'linear-gradient(to bottom, #000 65%, transparent)')}
      />
      <img
        src="/pdp-feather.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 hidden w-[16.625rem] xl:block"
        style={mask('linear-gradient(to left, #000 55%, transparent)', 'linear-gradient(to bottom, #000 65%, transparent)')}
      />

      <div className="relative mx-auto max-w-[78.3125rem] px-4 pb-16 pt-8 sm:px-6 xl:px-0">
        {!center && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#10241d]">
            <Link to="/" aria-label="Home" className="text-[#8a6d2f]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" /></svg>
            </Link>
            <span className="text-brand-secondary">›</span>
            <span className="font-medium">{crumb}</span>
          </nav>
        )}

        <div className={`mb-6 sm:mb-8 ${center ? 'mt-4 text-center' : 'mt-5'}`}>
          <h1 className="type-page font-serif font-medium text-[#0f3d2e]">{title}</h1>
          {subtitle && (
            <div className={`mt-2 flex items-center gap-4 ${center ? 'justify-center' : ''}`}>
              <p className="font-serif text-base text-[#10241d] sm:text-xl">{subtitle}</p>
              {!center && <span className="hidden h-px w-40 bg-gradient-to-r from-[#8a6d2f] to-transparent sm:block" />}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

/* Empty list message in the same look. */
export function EmptyPanel({ title, description, actionLabel, actionTo }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-[#fdf8ee] px-8 py-14 text-center shadow-card ring-1 ring-[#E8E0D3]">
      <svg className="mx-auto mb-4" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#b08d47" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" />
      </svg>
      <h2 className="font-serif text-2xl text-[#0f3d2e]">{title}</h2>
      <p className="mt-2 text-sm text-[#4a4a3f]">{description}</p>
      <Link to={actionTo} className="mt-6 inline-flex rounded-md bg-[#0f3d2e] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#0a2d22]">
        {actionLabel}
      </Link>
    </div>
  );
}
