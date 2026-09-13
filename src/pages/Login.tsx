import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import {
  Shield,
  Phone,
  Mail,
  User as UserIcon,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Hash,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  // Form State — captures email for OTP, and phone as essential personal contact detail
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    phone: '+91 ',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const { setUser } = useAppContext();
  const navigate = useNavigate();

  // ── Cooldown countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatPhoneNumber = (val: string): string => {
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) cleaned = '+91' + cleaned;
    return cleaned;
  };

  // ── Send OTP via College Email ──────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. student@amrita.edu or your Gmail).');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phone);
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter your 10-digit personal contact mobile number.');
      return;
    }

    setLoading(true);

    try {
      console.log(`📧 Dispatching Email OTP to ${cleanEmail} (Contact Phone: ${formattedPhone})…`);
      const res = await api.login({ email: cleanEmail, phone: formattedPhone });

      setStep(2);
      if (res.devOtp) setDevOtpCode(res.devOtp);
      setInfoMessage(res.message || `Verification OTP sent to ${cleanEmail}. Please check your inbox.`);
      setCooldown(60);
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      setError(err.message || 'Failed to dispatch verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    setInfoMessage('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const formattedPhone = formatPhoneNumber(formData.phone);

    try {
      const res = await api.login({ email: cleanEmail, phone: formattedPhone });
      if (res.devOtp) setDevOtpCode(res.devOtp);
      setInfoMessage(res.message || `Fresh verification OTP sent to ${cleanEmail}.`);
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Unable to resend OTP. Please wait before trying again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      setLoading(false);
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const formattedPhone = formatPhoneNumber(formData.phone);

    try {
      console.log(`🔐 Verifying cryptographic OTP code for ${cleanEmail}...`);
      const user = await api.verifyOtp(
        { email: cleanEmail, phone: formattedPhone },
        code,
        {
          fullName: formData.fullName,
          email: cleanEmail,
          rollNumber: formData.rollNumber,
          phone: formattedPhone,
        }
      );

      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      setError(err.message || 'Invalid or expired OTP. Please check your email code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input helpers ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/[^\d]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto-advance
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  // ── Demo / Instant Access ───────────────────────────────────────────────────
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoEmail = formData.email || 'demo@amrita.edu';
      const demoPhone = formData.phone && formData.phone.length >= 10 ? formatPhoneNumber(formData.phone) : '+919384387787';
      const demoUser = await api.verifyOtp(
        { email: demoEmail, phone: demoPhone },
        '654321',
        {
          fullName: formData.fullName || 'Demo Student',
          email: demoEmail,
          rollNumber: formData.rollNumber || 'CB.EN.U4CSE21001',
          phone: demoPhone,
        }
      );
      setUser(demoUser);
      navigate('/dashboard');
    } catch {
      // Local fallback session
      const demoUser = {
        id: `u-${Date.now()}`,
        fullName: formData.fullName || 'Demo Student',
        email: formData.email || 'demo@amrita.edu',
        rollNumber: formData.rollNumber || 'CB.EN.U4CSE21001',
        phone: formData.phone || '+919384387787',
        phoneVerified: 1,
        emailVerified: 1,
      };
      setUser(demoUser);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat fixed inset-0 z-50"
      style={{ backgroundImage: "url('/avvp-image.jpeg')" }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 z-10 mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-campus-100 text-campus-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-md">
            <Shield className="w-8 h-8 text-campus-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to AmritaFind</h1>
          <p className="text-slate-500 mt-2 text-sm">Amrita Vishwa Vidyapeetham's trusted Lost &amp; Found.</p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Enter details ── */}
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    required
                    type="text"
                    className="input-field pl-10"
                    placeholder="e.g. Kanishk"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  College Email <span className="text-campus-600 font-semibold text-xs">(OTP Sent Here)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-campus-600" />
                  <input
                    required
                    type="email"
                    className="input-field pl-10 border-campus-300 focus:border-campus-600"
                    placeholder="student@amrita.edu or personal gmail"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Your 6-digit verification OTP will be sent directly to this email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Personal Contact Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    required
                    type="tel"
                    className="input-field pl-10"
                    placeholder="+91 9384387787"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Saved to your profile so students/finders can contact you when your item is found.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    required
                    type="text"
                    className="input-field pl-10"
                    placeholder="CB.EN.U4CSE21001"
                    value={formData.rollNumber}
                    onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-2.5 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Verification Code via Email</span>
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/95 px-2 text-slate-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200"
              >
                ⚡ Enter Website Directly (Instant Access)
              </button>
            </motion.form>
          ) : (
            /* ── STEP 2: Enter OTP ── */
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6 text-center"
            >
              <div>
                <p className="text-slate-600 text-sm">
                  Enter the 6-digit OTP code sent to: <br />
                  <span className="font-bold text-slate-900 text-base">{formData.email}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  📱 Contact Phone: <span className="font-medium text-slate-700">{formatPhoneNumber(formData.phone)}</span> (stored in DB)
                </p>
              </div>

              {infoMessage && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {devOtpCode && (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs text-left">
                  <span>
                    🔑 Development OTP: <strong className="font-mono text-sm tracking-wider">{devOtpCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtpCode.split(''))}
                    className="font-bold underline text-amber-900 hover:text-amber-950 ml-2"
                  >
                    Autofill
                  </button>
                </div>
              )}

              {/* 6-box OTP input */}
              <div className="flex justify-center gap-2">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    className="w-11 h-13 text-center text-xl font-bold border border-slate-300 rounded-lg focus:border-campus-500 focus:ring-2 focus:ring-campus-500/20 outline-none transition"
                    value={otp[i]}
                    onPaste={handleOtpPaste}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify OTP & Enter AmritaFind'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleResendOtp}
                    className={`flex items-center gap-1 font-medium ${
                      cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-campus-600 hover:underline cursor-pointer'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setError('');
                      setInfoMessage('');
                    }}
                    className="text-slate-500 hover:underline"
                  >
                    ← Edit email or phone
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
