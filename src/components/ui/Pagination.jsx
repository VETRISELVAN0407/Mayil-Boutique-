/** Previous/next pager for the zero-based pages returned by the admin list endpoints. */
export default function Pagination({ page, totalPages, totalElements, onChange, disabled = false }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between gap-3 text-sm">
      <span className="text-brand-secondary">Page {page + 1} of {totalPages} · {totalElements} total</span>
      <div className="flex gap-2">
        <button
          disabled={disabled || page <= 0}
          onClick={() => onChange(page - 1)}
          className="btn-ghost py-1.5 px-3 text-xs border border-brand-border disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
          className="btn-ghost py-1.5 px-3 text-xs border border-brand-border disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
