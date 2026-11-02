import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;

export default function AdminAccount() {
  const { changeAdminPassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const update = (field) => (e) => { setForm((prev) => ({ ...prev, [field]: e.target.value })); setDone(false); };

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setDone(false);
    if (form.next.length < MIN_LENGTH || form.next.length > MAX_LENGTH) {
      setError(`New password must be ${MIN_LENGTH} to ${MAX_LENGTH} characters.`); return;
    }
    if (form.next !== form.confirm) { setError('The new passwords do not match.'); return; }
    if (form.next === form.current) { setError('New password must be different from the current one.'); return; }
    setBusy(true);
    try {
      await changeAdminPassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-peacock-gold" />
        <h2 className="font-serif text-2xl font-bold text-peacock-deep">Account</h2>
      </div>
      <p className="text-sm text-brand-secondary mt-1 ml-3">Change your admin password. Other signed-in devices are signed out.</p>

      <form onSubmit={submit} className="mt-6 bg-white shadow-card p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            <span className="flex-shrink-0">⚠</span><span>{error}</span>
          </div>
        )}
        {done && (
          <div className="bg-success/5 border border-success/30 px-4 py-3 text-sm text-success" role="status">
            Password changed.
          </div>
        )}
        <label className="block text-sm">
          Current password
          <input type="password" autoComplete="current-password" value={form.current} onChange={update('current')} required className="input-field mt-1 w-full" />
        </label>
        <label className="block text-sm">
          New password
          <input type="password" autoComplete="new-password" value={form.next} onChange={update('next')} required minLength={MIN_LENGTH} maxLength={MAX_LENGTH} className="input-field mt-1 w-full" />
          <span className="text-xs text-brand-secondary">{MIN_LENGTH} to {MAX_LENGTH} characters.</span>
        </label>
        <label className="block text-sm">
          Confirm new password
          <input type="password" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} required className="input-field mt-1 w-full" />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
