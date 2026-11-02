import { useEffect, useState } from 'react';
import * as adminTryOnService from '../../services/adminTryOnService';
import { errorMessage } from '../../utils/catalog';

const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];
const TYPE_LABEL = {
  UPPER_BODY: 'Top / Kurti / Shirt / Blouse',
  DRESS: 'Dress',
  SALWAR_SUIT: 'Salwar suit',
  SAREE: 'Saree',
  LEHENGA: 'Lehenga',
};
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

function Card({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-card ring-1 ring-[#ece3cf]">
      <p className="text-xs uppercase tracking-wide text-brand-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-brand-secondary">{hint}</p>}
    </div>
  );
}

function CountList({ title, rows, labelOf = (l) => l, empty }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-card ring-1 ring-[#ece3cf]">
      <h2 className="mb-3 text-sm font-semibold text-brand-primary">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-brand-secondary">{empty}</p> : (
        <ul className="divide-y divide-[#f1e9d6]">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between gap-4 py-2 text-sm">
              <span className="truncate">{labelOf(r.label)}</span>
              <span className="font-semibold">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminTryOnStats() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);
    adminTryOnService.getTryOnStats(days)
      .then((data) => active && setStats(data))
      .catch((err) => active && setError(errorMessage(err, 'Failed to load Virtual Try-On statistics')));
    return () => { active = false; };
  }, [days]);

  const live = stats?.featureEnabled && stats?.providerConfigured;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-primary">Virtual Try-On</h1>
          <p className="text-sm text-brand-secondary">Usage of the AI preview feature. Customer photos are never shown here.</p>
        </div>
        <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field w-auto text-sm">
          {PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!stats && !error && <p className="text-sm text-brand-secondary">Loading…</p>}

      {stats && (
        <div className="space-y-5">
          <div className={`rounded-md px-4 py-3 text-sm ${live ? 'bg-success/10 text-success' : 'bg-amber-50 text-amber-800'}`} role="status">
            {live
              ? `Live. The AI engine handles: ${stats.supportedGarmentTypes.map((t) => TYPE_LABEL[t] ?? t).join(', ')}.`
              : !stats.providerConfigured
                ? 'Not live: no AI engine is connected (set TRYON_PROVIDER and TRYON_SERVICE_URL in backend/.env).'
                : 'Not live: Virtual Try-On is switched off (TRYON_ENABLED=false).'}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card label="Requests" value={stats.total} />
            <Card label="Successful" value={stats.succeeded} />
            <Card label="Failed" value={stats.failed} hint={stats.successRate == null ? 'No finished jobs yet' : `${Math.round(stats.successRate * 100)}% success rate`} />
            <Card label="Cancelled / expired" value={stats.abandoned} hint={stats.inProgress ? `${stats.inProgress} in progress` : undefined} />
            <Card label="Customers" value={stats.uniqueCustomers} />
            <Card label="Average time" value={stats.averageSeconds == null ? '–' : `${Math.round(stats.averageSeconds)} s`} hint="Request to finished preview" />
            <Card
              label="Estimated cost"
              value={stats.estimatedCost == null ? '–' : INR.format(stats.estimatedCost)}
              hint={stats.estimatedCost == null ? 'Set TRYON_COST_PER_JOB to see an estimate' : 'Successful previews × your configured cost'}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CountList title="By garment category" rows={stats.byGarmentType} labelOf={(l) => TYPE_LABEL[l] ?? l} empty="No requests yet" />
            <CountList title="Most tried-on products" rows={stats.topProducts} empty="No requests yet" />
          </div>

          <p className="text-xs text-brand-secondary">
            Each request is kept as a record (date, product, status and the time consent was given) so these numbers stay
            available. The photos and previews themselves are deleted automatically.
          </p>
        </div>
      )}
    </div>
  );
}
