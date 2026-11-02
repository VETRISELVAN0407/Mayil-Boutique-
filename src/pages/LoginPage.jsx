import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as authService from '../services/authService';
import { errorMessage } from '../utils/catalog';
import PageShell from '../components/ui/PageShell';

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [testOtp, setTestOtp] = useState(null); // only set by the backend in TEST MODE

  const { loginCustomer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendOtp() {
    setLoading(true);
    try {
      const data = await authService.requestCustomerOtp(mobile);
      setStep('otp');
      setResendIn(RESEND_SECONDS);
      if (data?.testMode && data?.testOtp) {
        setTestOtp(data.testOtp);
        setOtp('');
        toast.success('Test OTP generated.');
      } else {
        setTestOtp(null);
        toast.success('OTP sent to your mobile number.');
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Could not send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function copyTestOtp() {
    try {
      await navigator.clipboard.writeText(testOtp);
      toast.success('OTP copied.');
    } catch {
      toast.error('Could not copy. Please type the OTP shown above.');
    }
  }

  function handleRequestOtp(e) {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    sendOtp();
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits.');
      return;
    }
    setLoading(true);
    try {
      await loginCustomer(mobile, otp);
      toast.success('Welcome to Mayil Boutique!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'Incorrect or expired OTP.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      center
      title={step === 'mobile' ? 'Sign In' : 'Enter OTP'}
      subtitle={
        step === 'mobile'
          ? 'Welcome to Mayil Boutique'
          : testOtp
            ? `Test OTP generated for +91 ${mobile}`
            : `OTP sent to +91 ${mobile}`
      }
    >
      <div className="mx-auto w-full max-w-md">
        <p className="-mt-4 mb-6 text-center text-sm text-[#4a4a3f]">
          {step === 'mobile'
            ? 'Enter your mobile number to receive a one-time password. New here? Your account is created the first time you verify.'
            : 'Enter the 6-digit code to continue.'}
        </p>

        <div className="card-cream p-8">
          {step === 'mobile' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f] mb-1.5">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-[#d8cdb4] bg-[#f3ede2] px-3 text-sm text-[#4a4a3f]">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-cream flex-1 rounded-l-none"
                    required
                    autoFocus
                    maxLength={10}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-green h-[3.25rem] w-full text-lg">
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {testOtp && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center" role="status">
                  <p className="text-[0.625rem] font-bold uppercase tracking-widest text-amber-800">
                    Development / Test Mode
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.4em] text-brand-primary select-all">
                    {testOtp}
                  </p>
                  <button type="button" onClick={copyTestOtp} className="btn-ghost mt-1 text-xs text-[#0f5a3f]">
                    Copy OTP
                  </button>
                  <p className="mt-1 text-xs text-amber-900">
                    Real SMS/WhatsApp delivery is temporarily disabled. Copy this OTP and enter it below.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f] mb-1.5">
                  One-Time Password
                </label>
                <input
                  type="tel"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="input-cream text-center text-lg tracking-[0.4em] font-mono"
                  required
                  autoFocus
                  maxLength={6}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-green h-[3.25rem] w-full text-lg">
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading || resendIn > 0}
                className="btn-ghost w-full text-xs text-[#0f5a3f] disabled:text-brand-secondary"
              >
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('mobile'); setOtp(''); setTestOtp(null); }}
                className="btn-ghost w-full text-xs text-brand-secondary"
              >
                ← Change mobile number
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-brand-secondary text-center mt-4">
          By signing in, you agree to our{' '}
          <Link to="/policy/terms" className="text-[#0f5a3f] hover:underline">Terms</Link> &{' '}
          <Link to="/policy/privacy" className="text-[#0f5a3f] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </PageShell>
  );
}
