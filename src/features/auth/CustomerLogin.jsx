import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

export default function CustomerLogin() {
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    if (!mobile.trim()) {
      setError('Mobile number is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authService.requestCustomerOtp(mobile.trim());
      setCode('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!mobile.trim() || !code.trim()) {
      setError('Mobile number and OTP are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await loginCustomer(mobile.trim(), code.trim());
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-navy">Customer Login</h2>
        <p className="mt-1 text-sm text-gray-600">Login with your mobile number and OTP</p>

        <form onSubmit={handleRequestOtp} className="mt-4 space-y-4">
          <div>
            <label htmlFor="customer-mobile" className="block text-sm font-medium text-navy">Mobile Number</label>
            <input
              id="customer-mobile"
              name="mobile"
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-peacock-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-peacock-500 px-4 py-2 text-sm font-semibold text-white hover:bg-peacock-600 disabled:opacity-60"
          >
            {submitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <form onSubmit={handleVerify} className="mt-4 space-y-4 border-t border-gray-200 pt-4">
          <div>
            <label htmlFor="customer-code" className="block text-sm font-medium text-navy">OTP</label>
            <input
              id="customer-code"
              name="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-peacock-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-peacock-500 px-4 py-2 text-sm font-semibold text-white hover:bg-peacock-600 disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>
    </div>
  );
}
