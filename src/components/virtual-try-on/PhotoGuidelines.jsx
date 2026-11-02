const TIPS = [
  'Stand facing the camera in a front-facing pose',
  'A full-body photo works best (head to toe)',
  'Use good, even lighting',
  'Choose a simple, uncluttered background',
  'Keep your arms and body clear of bags or objects',
  'Avoid blurry or heavily filtered photos',
];

export default function PhotoGuidelines() {
  return (
    <section aria-labelledby="photo-tips" className="rounded-xl bg-[#fdf8ee] p-5 ring-1 ring-[#E8E0D3]">
      <h2 id="photo-tips" className="font-serif text-lg text-[#0f3d2e]">For the best preview</h2>
      <ul className="mt-3 space-y-2 text-sm text-[#4a4a3f]">
        {TIPS.map((t) => (
          <li key={t} className="flex gap-2">
            <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b08d47" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-brand-secondary">
        The preview is an AI illustration, not a measurement. It cannot show exact fit, size or colour.
      </p>
    </section>
  );
}
