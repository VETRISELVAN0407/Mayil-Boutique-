import { formatDate } from '../../utils/format';

const STAGES = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

/**
 * Backend status -> index of the stage the order has reached (0..3), or -1 when it has not reached the first
 * stage yet. PROCESSING sits between Confirmed and Packed, so it still counts as Confirmed. Return/refund
 * statuses happen after delivery, so the whole journey stays complete. Anything not listed (CANCELLED or a
 * status this screen does not know) gets no progress bar.
 */
const STAGE_INDEX = {
  PENDING: -1,
  CONFIRMED: 0,
  PROCESSING: 0,
  PACKED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  RETURN_REQUESTED: 3,
  RETURNED: 3,
  REFUND_PENDING: 3,
  REFUNDED: 3,
};

const NOTES = {
  PENDING: 'Order placed. Waiting for confirmation from Mayil Boutique.',
  PROCESSING: 'Your order is being prepared.',
  RETURN_REQUESTED: 'Return requested for this delivered order.',
  RETURNED: 'This order was returned.',
  REFUND_PENDING: 'Return received. Your refund is being processed.',
  REFUNDED: 'This order was returned and refunded.',
};

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function OrderTimeline({ order }) {
  const status = order?.status;

  if (status === 'CANCELLED') {
    return (
      <div role="status" className="mb-4 flex items-center gap-3 rounded-lg border border-brand-sale/30 bg-brand-sale/5 px-4 py-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-sale text-white" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </span>
        <div>
          <p className="font-serif text-base text-brand-sale">Order cancelled</p>
          <p className="text-xs text-brand-secondary">This order will not be delivered.</p>
        </div>
      </div>
    );
  }

  // Unknown / missing status: show nothing rather than guess.
  if (!Object.prototype.hasOwnProperty.call(STAGE_INDEX, status)) return null;

  const reached = STAGE_INDEX[status];
  const delivered = reached === STAGES.length - 1;
  const fill = reached <= 0 ? 0 : (reached / (STAGES.length - 1)) * 100;
  const note = NOTES[status];

  return (
    <div className="mb-5 rounded-lg bg-[#fdf8ee] px-3 pb-4 pt-5 ring-1 ring-[#E8E0D3] sm:px-6">
      <ol className="relative grid grid-cols-4" aria-label="Order progress">
        {/* Line runs between the centres of the first and last circle (each column is 25% wide). */}
        <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-4 h-1 -translate-y-1/2 rounded-full bg-[#d8d2c4]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[#0f5a3f] transition-[width] duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none"
            style={{ width: `${fill}%` }}
          />
        </div>

        {STAGES.map((label, i) => {
          const done = i < reached || (delivered && i === reached);
          const current = i === reached && !delivered;
          return (
            <li key={label} className="relative flex flex-col items-center text-center" aria-current={i === reached ? 'step' : undefined}>
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 motion-reduce:transition-none ${
                  done
                    ? 'bg-[#0f5a3f] text-white'
                    : current
                      ? 'bg-white text-[#0f5a3f] ring-4 ring-[#0f5a3f]/25 border-2 border-[#0f5a3f]'
                      : 'bg-[#d8d2c4] text-white'
                }`}
              >
                {done ? <Check /> : current ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0f5a3f]" /> : <Check />}
              </span>
              <span className={`mt-2 text-[0.6875rem] leading-tight sm:text-sm ${done || current ? 'font-semibold text-[#0f3d2e]' : 'text-brand-secondary'}`}>
                {label}
              </span>
              <span className="sr-only">{done ? ' (completed)' : current ? ' (current step)' : ' (upcoming)'}</span>
              {i === STAGES.length - 1 && delivered && order.deliveredAt && (
                <span className="mt-0.5 text-[0.625rem] text-brand-secondary sm:text-xs">{formatDate(order.deliveredAt)}</span>
              )}
            </li>
          );
        })}
      </ol>
      {note && <p className="mt-3 text-center text-xs text-[#4a4a3f]">{note}</p>}
    </div>
  );
}
