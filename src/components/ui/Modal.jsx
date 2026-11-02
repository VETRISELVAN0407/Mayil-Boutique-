import { useEffect } from 'react';

/** Centered dialog with a blurred backdrop. Closes on Esc, the × button or a click on the backdrop. */
export default function Modal({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#08241b]/55 p-3 backdrop-blur-sm sm:py-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} overflow-hidden rounded-xl bg-[#fdf9ef] shadow-[0_24px_70px_rgba(0,0,0,0.35)]`}
      >
        {/* gold edge along the top */}
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#d9b25f] via-[#f1d68f] to-[#d9b25f]" aria-hidden="true" />

        <div className="relative flex items-start gap-3 border-b border-[#ece3cf] px-5 py-3.5 pr-12 sm:px-6">
          <img
            src="/pdp-feather.jpg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-full w-32 object-cover object-left opacity-70"
            style={{
              mixBlendMode: 'multiply',
              WebkitMaskImage: 'linear-gradient(to left, #000 45%, transparent)',
              maskImage: 'linear-gradient(to left, #000 45%, transparent)',
            }}
          />
          <svg className="relative mt-1 flex-shrink-0" width="22" height="22" viewBox="0 0 24 24" fill="#d9a441" aria-hidden="true">
            <path d="M3 12.6V4a1 1 0 0 1 1-1h8.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0L3.3 13.3a1 1 0 0 1-.3-.7zM7.5 8a1.5 1.5 0 1 0 0-.01z" />
          </svg>
          <div className="relative min-w-0">
            <h3 className="font-serif text-xl font-medium leading-tight text-[#0f3d2e]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[#5d625d]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xl leading-none text-[#0f3d2e] transition-colors hover:bg-[#0f3d2e]/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
