import { useEffect, useState } from 'react';

const STEPS = [
  'Reading your photo…',
  'Fitting the outfit to your pose…',
  'Adding fabric detail and colour…',
  'Putting the finishing touches…',
];

/** Shown while a job is PENDING or PROCESSING. Always offers a way out, so it can never be an endless spinner. */
export default function GenerationProgress({ productName, onCancel, cancelling }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(seconds / 8))];

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-[#fdf8ee] px-8 py-12 text-center shadow-card ring-1 ring-[#E8E0D3]" role="status" aria-live="polite">
      <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-[#E3BF72]/40 border-t-[#0f3d2e]" aria-hidden="true" />
      <h2 className="mt-6 font-serif text-2xl text-[#0f3d2e]">Creating your preview</h2>
      {productName && <p className="mt-1 text-sm text-[#4a4a3f]">{productName}</p>}
      <p className="mt-4 text-sm text-[#10241d]">{step}</p>
      <p className="mt-1 text-xs text-brand-secondary">This usually takes under a minute. Please keep this page open.</p>
      {seconds >= 45 && <p className="mt-3 text-xs text-[#8a6d2f]">Taking a little longer than usual…</p>}
      <button type="button" onClick={onCancel} disabled={cancelling} className="mt-6 text-sm text-brand-secondary underline hover:text-[#10241d] disabled:opacity-50">
        {cancelling ? 'Cancelling…' : 'Cancel and delete my photo'}
      </button>
    </div>
  );
}
