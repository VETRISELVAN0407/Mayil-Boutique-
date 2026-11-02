export default function QuantitySelector({ value, onChange, min = 1, max = 10 }) {
  return (
    <div className="inline-flex items-center border border-brand-border">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center text-brand-primary hover:bg-ivory disabled:opacity-40 transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-10 h-9 flex items-center justify-center text-sm font-medium border-x border-brand-border">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center text-brand-primary hover:bg-ivory disabled:opacity-40 transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
