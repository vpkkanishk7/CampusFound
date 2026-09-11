import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import { auth } from '../config/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import {
  Shield,
  Phone,
  Mail,
  User as UserIcon,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend window for reCAPTCHA widget id
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
  }
}

// ── Dev-mode fallback flag ─────────────────────────────────────────────────
// Set VITE_DEV_OTP_FALLBACK=true in your .env to allow the mock-OTP fallback.
// When false (default for production), Firebase errors surface as real messages.
const DEV_OTP_FALLBACK_ENABLED = import.meta.env.VITE_DEV_OTP_FALLBACK === 'true';

// Firebase infrastructure error codes that indicate the project itself is not
// set up for Phone Auth yet (not a user mistake). Only these trigger dev fallback.
const FIREBASE_SETUP_ERRORS = new Set([
  'auth/operation-not-allowed',      // Phone Auth not enabled in Firebase Console
  'auth/app-not-authorized',         // App not registered / SHA cert missing
  'auth/billing-not-enabled',        // Blaze plan not activated
  'auth/network-request-failed',     // Offline / Firebase blocked by network
  'auth/internal-error',             // Firebase backend error / quota exceeded
  'auth/invalid-app-credential',     // reCAPTCHA site key mismatch
  'auth/captcha-check-failed',       // reCAPTCHA domain not whitelisted
]);

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  // Track whether we're in backend-OTP fallback mode (no Firebase confirmationResult)
  const [backendFallback, setBackendFallback] = useState(false);
  // Store the original Firebase error for surfacing if fallback is not available
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    phone: '+91',
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

  // ── Initialize invisible reCAPTCHA once on mount ────────────────────────────
  // Firebase requires the reCAPTCHA verifier to be instantiated with a live
  // DOM node. We do this once when the component mounts to avoid race
  // conditions with the button-click approach.
  useEffect(() => {
    initRecaptcha();
    return () => {
      // Clean up verifier on unmount
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initRecaptcha = () => {
    // Only create once; bail out if already created
    if (window.recaptchaVerifier) return;
    if (!recaptchaContainerRef.current) return;

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current,
        {
          size: 'invisible',
          callback: () => {
            console.log('✅ reCAPTCHA verified');
          },
          'expired-callback': () => {
            setError('reCAPTCHA session expired. Please click "Send OTP" again.');
            resetRecaptcha();
          },
        }
      );
      // Render immediately so it's ready when the user clicks
      window.recaptchaVerifier.render().then(widgetId => {
        window.recaptchaWidgetId = widgetId;
        console.log('✅ Invisible reCAPTCHA rendered, widgetId:', widgetId);
      }).catch(err => {
        console.warn('reCAPTCHA render warning (non-fatal):', err);
      });
    } catch (err) {
      console.warn('reCAPTCHA init warning:', err);
    }
  };

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
      window.recaptchaVerifier = undefined;
    }
    // Re-init for next attempt
    setTimeout(initRecaptcha, 100);
  };

  const formatPhoneNumber = (val: string): string => {
    // Keep only digits and leading '+'
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) cleaned = '+91' + cleaned;
    return cleaned;
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phone);
    if (formattedPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +91 9876543210).');
      return;
    }

    setLoading(true);

    // Ensure reCAPTCHA is ready
    if (!window.recaptchaVerifier) {
      initRecaptcha();
      // Small wait for it to be ready
      await new Promise(r => setTimeout(r, 300));
    }

    try {
      const verifier = window.recaptchaVerifier!;
      console.log(`📡 Sending Firebase SMS OTP to ${formattedPhone}…`);

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setBackendFallback(false);
      setStep(2);
      setInfoMessage(`SMS OTP sent to ${formattedPhone} via Firebase.`);
      setCooldown(60);
    } catch (err: any) {
      console.error('Firebase Phone Auth Error:', err.code, err.message);
      resetRecaptcha();

      // ── User-input errors: always surface directly, never fall back ─────────
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Use international format: +91 9876543210');
        setLoading(false);
        return;
      }
      if (err.code === 'auth/missing-phone-number') {
        setError('Phone number is required.');
        setLoading(false);
        return;
      }
      if (err.code === 'auth/too-many-requests') {
        setError('Too many OTP requests to this number. Please wait a few minutes.');
        setLoading(false);
        return;
      }

      // ── Firebase project-setup errors: only fall back if DEV_OTP_FALLBACK is on ──
      // If it is a known setup error AND dev fallback is enabled → use mock OTP
      // If it is a known setup error AND dev fallback is disabled → show clear fix instructions
      // If it is an unknown error → always surface it (never hide real bugs)
      if (FIREBASE_SETUP_ERRORS.has(err.code)) {
        setFirebaseError(err.code);
        if (DEV_OTP_FALLBACK_ENABLED) {
          console.warn(`[DEV] Firebase setup error (${err.code}) — falling back to mock OTP. Set VITE_DEV_OTP_FALLBACK=false to disable.`);
          await handleBackendOtpFallback(formattedPhone);
        } else {
          // Production: surface the exact Firebase error with actionable instructions
          const setupMessages: Record<string, string> = {
            'auth/operation-not-allowed':   'Firebase Phone Auth is not enabled. Go to Firebase Console → Authentication → Sign-in method → Phone → Enable.',
            'auth/app-not-authorized':      'This domain is not authorized for Firebase Phone Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
            'auth/billing-not-enabled':     'Firebase Phone Auth requires the Blaze (pay-as-you-go) plan. Upgrade at console.firebase.google.com.',
            'auth/network-request-failed':  'Network error — Firebase could not be reached. Check your internet connection.',
            'auth/internal-error':          'Firebase internal error. This may be a quota issue. Check Firebase Console → Authentication → Usage.',
            'auth/invalid-app-credential':  'reCAPTCHA credential mismatch. Ensure this domain is in Authorized Domains in Firebase Console.',
            'auth/captcha-check-failed':    'reCAPTCHA check failed. Ensure this domain is whitelisted in Firebase Console → Authentication → Settings.',
          };
          setError(setupMessages[err.code] || `Firebase error: ${err.code} — ${err.message}`);
        }
      } else {
        // Unknown or unexpected error — always show it clearly
        console.error(`Unexpected Firebase error (${err.code}):`, err.message);
        setError(`Authentication error (${err.code || 'unknown'}): ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackendOtpFallback = async (formattedPhone: string) => {
    // This function must ONLY be called when DEV_OTP_FALLBACK_ENABLED is true.
    // It is guarded in handleSendOtp — do not call directly in production paths.
    try {
      await api.login(formattedPhone);
    } catch {
      // Backend may be offline; mock OTP still works client-side
    }
    setBackendFallback(true);
    setConfirmationResult(null);
    setStep(2);
    setInfoMessage(
      '⚙️ Development Mode Active — Firebase Phone Auth not yet configured. Use test code: 654321'
    );
    setCooldown(60);
  };


  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    setInfoMessage('');

    const formattedPhone = formatPhoneNumber(formData.phone);

    if (backendFallback) {
      await handleBackendOtpFallback(formattedPhone);
      setLoading(false);
      return;
    }

    resetRecaptcha();
    await new Promise(r => setTimeout(r, 300));

    try {
      const verifier = window.recaptchaVerifier!;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setInfoMessage(`Fresh OTP sent to ${formattedPhone}.`);
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait before requesting another OTP.');
      } else {
        setError(err.message || 'Unable to resend OTP. Please try again.');
      }
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

    const formattedPhone = formatPhoneNumber(formData.phone);

    try {
      if (confirmationResult && !backendFallback) {
        // ── Firebase path: verify the code with Firebase first ──────────────
        console.log(`🔐 Verifying Firebase OTP: ${code}`);
        const userCredential = await confirmationResult.confirm(code);
        console.log('✅ Firebase verification success, UID:', userCredential.user.uid);
      }

      // ── Always call backend to create/update user record in DB ────────────
      const user = await api.verifyOtp(formattedPhone, code, {
        fullName: formData.fullName,
        email: formData.email,
        rollNumber: formData.rollNumber,
        phone: formattedPhone,
      });

      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('OTP Verification Error:', err.code, err.message);

      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please check the SMS and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP has expired. Please go back and request a new code.');
      } else if (err.code === 'auth/session-expired') {
        setError('Session expired. Please go back and request a new OTP.');
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
      }
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
      const demoUser = await api.verifyOtp(
        formData.phone || '+919578398848',
        '654321',
        {
          fullName: formData.fullName || 'Demo Student',
          email: formData.email || 'demo@amrita.edu',
          rollNumber: formData.rollNumber || 'CB.EN.U4CSE21001',
          phone: formData.phone || '+919578398848',
        }
      );
      setUser(demoUser);
      navigate('/dashboard');
    } catch {
      // Construct a demo user manually if backend is down
      setUser({
        id: `demo-${Date.now()}`,
        fullName: formData.fullName || 'Demo Student',
        email: formData.email || 'demo@amrita.edu',
        rollNumber: formData.rollNumber || 'CB.EN.U4CSE21001',
        phone: formData.phone || '+919578398848',
        phoneVerified: 1,
      });
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

      {/* Invisible reCAPTCHA container — must be in the DOM at all times */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 z-10 mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-campus-100 text-campus-800 rounded-2xl mx-auto flex items-center justify-center mb-4">
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
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">College Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    required
                    type="email"
                    className="input-field pl-10"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                <input
                  required
                  type="text"
                  className="input-field"
                  placeholder="CB.EN.U4CSE21001"
                  value={formData.rollNumber}
                  onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    required
                    type="tel"
                    className="input-field pl-10"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  OTP delivered via Firebase SMS (+91 supported). Standard rates may apply.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-2.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '📱 Send OTP via Firebase SMS'}
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
                  Enter the 6-digit code sent to <br />
                  <span className="font-semibold text-slate-900">{formatPhoneNumber(formData.phone)}</span>
                </p>
                {backendFallback ? (
                  <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-4 text-left space-y-2">
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <span>⚙️</span> Development Mode Active
                    </p>
                    <p className="text-xs text-amber-700">
                      Firebase Phone Auth is not yet enabled in your Firebase Console.
                      Use the test code below to continue:
                    </p>
                    <div className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-4 py-2.5">
                      <span className="font-mono text-2xl font-black tracking-[0.3em] text-slate-900">654321</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtp(['6','5','4','3','2','1']);
                        }}
                        className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition"
                      >
                        Auto-fill ↓
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    📲 Powered by Firebase SMS Authentication
                  </p>
                )}
              </div>

              {infoMessage && !backendFallback && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{infoMessage}</span>
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
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify OTP & Sign In'}
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
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setError('');
                      setInfoMessage('');
                      setConfirmationResult(null);
                      setBackendFallback(false);
                    }}
                    className="text-slate-500 hover:underline"
                  >
                    ← Edit phone number
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
