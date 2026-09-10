import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { Shield, Phone, Mail, User as UserIcon, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend window interface for RecaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    phone: '+91 ',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Clean up recaptcha verifier on component unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const formatPhoneNumber = (val: string) => {
    let cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+91' + cleaned;
    }
    return cleaned;
  };

  const getOrCreateRecaptcha = () => {
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        console.log('✅ Firebase reCAPTCHA verified');
      },
      'expired-callback': () => {
        setError('reCAPTCHA session expired. Please send OTP again.');
      }
    });

    return window.recaptchaVerifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    const formattedPhone = formatPhoneNumber(formData.phone);

    if (formattedPhone.length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +91 9876543210).');
      setLoading(false);
      return;
    }

    try {
      const verifier = getOrCreateRecaptcha();
      console.log(`📡 Requesting Firebase SMS OTP for ${formattedPhone}...`);
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setStep(2);
      setInfoMessage(`Real SMS OTP sent to ${formattedPhone} via Firebase Authentication.`);
      setCooldown(60);
    } catch (err: any) {
      console.error('Firebase Phone Auth Error:', err);
      
      // Reset recaptcha widget if error occurs
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.render().then((widgetId) => {
            // @ts-ignore
            if (window.grecaptcha) window.grecaptcha.reset(widgetId);
          });
        } catch {}
      }

      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please include your country code (e.g. +91 9876543210).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Phone Authentication is disabled in your Firebase console. Please go to Firebase Console -> Authentication -> Sign-in method -> Phone -> Enable -> Save.');
      } else if (err.code === 'auth/api-key-not-valid' || err.message?.includes('api-key-not-valid')) {
        console.warn('⚠️ Placeholder Firebase API Key detected. Falling back to backend OTP engine...');
        try {
          const res = await api.login(formattedPhone);
          setStep(2);
          setInfoMessage(res.message || 'OTP generated. Please check server console or enter code.');
          setCooldown(60);
        } catch {
          setError('Invalid Firebase API key. Please update VITE_FIREBASE_API_KEY in your .env file with your real key from Firebase Console.');
        }
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many SMS requests sent to this number. Please wait a few minutes before trying again.');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded for today. Please try again later or use Firebase test numbers.');
      } else if (err.code === 'auth/invalid-app-credential' || err.code === 'auth/app-not-authorized') {
        setError('Firebase domain authorization error. Make sure domain localhost is added to Firebase Auth settings.');
      } else {
        setError(err.message || 'Failed to send SMS OTP via Firebase. Please check your network and phone number.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    setInfoMessage('');

    const formattedPhone = formatPhoneNumber(formData.phone);

    try {
      const verifier = getOrCreateRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setInfoMessage(`Fresh Firebase SMS OTP code sent to ${formattedPhone}.`);
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Unable to resend SMS OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      if (confirmationResult) {
        // 1. Verify OTP with Firebase Phone Auth
        console.log(`🔐 Verifying code ${code} with Firebase...`);
        const userCredential = await confirmationResult.confirm(code);
        const firebaseUser = userCredential.user;
        console.log('✅ Firebase Phone Verification Successful! UID:', firebaseUser.uid);
      }

      // 2. Call Backend API to save/update user in SQLite database with phoneVerified = 1
      const user = await api.verifyOtp(formattedPhone, code, {
        ...formData,
        phone: formattedPhone
      });

      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('OTP Verification Error:', err);

      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect 6-digit OTP code entered. Please check your SMS and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('The OTP code has expired. Please click "Resend OTP".');
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      const lastInput = document.getElementById('otp-5');
      lastInput?.focus();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat fixed inset-0 z-50"
      style={{ backgroundImage: "url('/avvp-image.jpeg')" }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>

      {/* Hidden Container for Firebase Invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 z-10 mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-campus-100 text-campus-800 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-campus-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to AmritaFind</h1>
          <p className="text-slate-500 mt-2 text-sm">Amrita Vishwa Vidyapeetham's trusted Lost & Found.</p>
        </div>

        <AnimatePresence mode="wait">
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
                  <input required type="text" className="input-field pl-10" placeholder="Full Name" 
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">College Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input required type="email" className="input-field pl-10" placeholder="Email Address" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                <input required type="text" className="input-field" placeholder="Roll Number" 
                  value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input required type="tel" className="input-field pl-10" placeholder="+91 9876543210" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Real SMS delivered via Firebase Phone Authentication (+91 supported)</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-2.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Firebase SMS OTP'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/95 px-2 text-slate-400">or</span></div>
              </div>

              <button 
                type="button" 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const demoUser = await api.verifyOtp(
                      formData.phone || '+919578398848',
                      '654321',
                      {
                        fullName: formData.fullName || 'Sarvikha K',
                        email: formData.email || 'sarvikha67@gmail.com',
                        rollNumber: formData.rollNumber || '90',
                        phone: formData.phone || '+919578398848'
                      }
                    );
                    setUser(demoUser);
                  } catch {
                    setUser({
                      id: 'u-1',
                      fullName: formData.fullName || 'Sarvikha K',
                      email: formData.email || 'sarvikha67@gmail.com',
                      rollNumber: formData.rollNumber || '90',
                      phone: formData.phone || '+919578398848',
                      phoneVerified: 1
                    });
                  } finally {
                    setLoading(false);
                    navigate('/dashboard');
                  }
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200"
              >
                ⚡ Enter Website Directly (Instant Access)
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleVerifyOtp} 
              className="space-y-6 text-center"
            >
              <div>
                <p className="text-slate-600 text-sm">
                  Enter the 6-digit SMS code sent to <br/>
                  <span className="font-semibold text-slate-900">{formatPhoneNumber(formData.phone)}</span>
                </p>
                <p className="text-xs text-amber-600 font-medium mt-1">📲 Powered by Firebase SMS Authentication</p>
              </div>

              {infoMessage && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <div className="flex justify-center gap-2">
                {[...Array(6)].map((_, i) => (
                  <input 
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-11 h-13 text-center text-xl font-bold border border-slate-300 rounded-lg focus:border-campus-500 focus:ring-2 focus:ring-campus-500/20"
                    value={otp[i]}
                    onPaste={handleOtpPaste}
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      const newOtp = [...otp];
                      newOtp[i] = val;
                      setOtp(newOtp);
                      if (val && i < 5) {
                        const next = document.getElementById(`otp-${i+1}`);
                        next?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) {
                        const prev = document.getElementById(`otp-${i-1}`);
                        prev?.focus();
                      }
                    }}
                    id={`otp-${i}`}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                    className={`flex items-center gap-1 font-medium ${cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-campus-600 hover:underline cursor-pointer'}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend SMS in ${cooldown}s` : 'Resend SMS'}
                  </button>

                  <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:underline">
                    Edit phone number
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
