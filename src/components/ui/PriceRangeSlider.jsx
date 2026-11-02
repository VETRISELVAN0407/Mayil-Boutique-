import { useEffect, useState } from 'react';

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** Dual-handle price slider with ₹ min/max boxes. `value` is [low, high]; both stay within [min, max]. */
export default function PriceRangeSlider({ min, max, value, onChange }) {
  const [low, high] = value;
  const [draft, setDraft] = useState({ low: String(low), high: String(high) });

  useEffect(() => {
    setDraft({ low: String(low), high: String(high) });
  }, [low, high]);

  if (max <= min) return null;

  const span = max - min;
  const leftPct = ((low - min) / span) * 100;
  const rightPct = ((high - min) / span) * 100;

  function commit(which) {
    const parsed = Number(draft[which]);
    if (draft[which].trim() === '' || Number.isNaN(parsed)) {
      setDraft({ low: String(low), high: String(high) });
      return;
    }
    if (which === 'low') onChange([clamp(Math.round(parsed), min, high), high]);
    else onChange([low, clamp(Math.round(parsed), low, max)]);
  }

  const boxClass = 'flex flex-1 items-center gap-1 rounded-md border border-[#E8E0D3] bg-white px-3 py-2 font-serif text-sm';

  return (
    <div>
      <div className="relative mx-1 mt-1 h-5">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-[#E8E0D3]" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-[#0f3d2e]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          className="range-thumb"
          aria-label="Minimum price"
          min={min}
          max={max}
          step={1}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
        />
        <input
          type="range"
          className="range-thumb"
          aria-label="Maximum price"
          min={min}
          max={max}
          step={1}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <label className={boxClass}>
          <span className="text-brand-secondary">₹</span>
          <input
            type="number"
            inputMode="numeric"
            aria-label="Minimum price"
            value={draft.low}
            onChange={(e) => setDraft((d) => ({ ...d, low: e.target.value }))}
            onBlur={() => commit('low')}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-full min-w-0 bg-transparent focus:outline-none"
          />
        </label>
        <span className="text-xs text-brand-secondary">–</span>
        <label className={boxClass}>
          <span className="text-brand-secondary">₹</span>
          <input
            type="number"
            inputMode="numeric"
            aria-label="Maximum price"
            value={draft.high}
            onChange={(e) => setDraft((d) => ({ ...d, high: e.target.value }))}
            onBlur={() => commit('high')}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-full min-w-0 bg-transparent focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}
